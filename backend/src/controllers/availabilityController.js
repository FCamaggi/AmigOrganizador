import Schedule from '../models/Schedule.js';
import Group from '../models/Group.js';
import {
    minutesToTime,
    slotBusyBlocksForDay,
    timeToMinutes
} from '../utils/timeSlots.js';

const DEFAULT_SETTINGS = {
    usefulStart: '08:00',
    usefulEnd: '22:00',
    minimumBlockMinutes: 120,
    alternativeThreshold: 80
};

const clampBlock = (block, start, end) => ({
    start: Math.max(block.start, start),
    end: Math.min(block.end, end)
});

const mergeBlocks = (blocks) => {
    const sorted = blocks
        .filter(block => block.end > block.start)
        .sort((a, b) => a.start - b.start);

    const merged = [];
    sorted.forEach(block => {
        const last = merged[merged.length - 1];
        if (!last || last.end < block.start) {
            merged.push({ ...block });
        } else {
            last.end = Math.max(last.end, block.end);
        }
    });

    return merged;
};

const getMemberId = (member) => {
    if (!member || !member.user) {
        return null;
    }

    return member.user._id ? member.user._id.toString() : member.user.toString();
};

const memberInfoFromSchedule = (schedule) => ({
    userId: schedule.user._id,
    username: schedule.user.username || schedule.user.email,
    fullName: schedule.user.fullName
});

const getEffectiveSettings = (group) => ({
    ...DEFAULT_SETTINGS,
    ...(group.settings?.availability || {})
});

const getPreviousDayAvailability = (schedule, day, previousSchedules) => {
    if (day > 1) {
        return schedule.availability.find(availability => availability.day === day - 1) || null;
    }

    const scheduleUserId = schedule.user._id
        ? schedule.user._id.toString()
        : schedule.user.toString();
    const previousSchedule = previousSchedules.find(
        item => item.user.toString() === scheduleUserId
    );

    if (!previousSchedule) return null;

    const previousMonthLastDay = new Date(
        previousSchedule.year,
        previousSchedule.month,
        0
    ).getDate();

    return previousSchedule.availability.find(
        availability => availability.day === previousMonthLastDay
    ) || null;
};

const getBusyBlocksForDay = (schedule, day, previousSchedules, usefulStart, usefulEnd) => {
    const dayAvailability = schedule.availability.find(availability => availability.day === day);
    const previousAvailability = getPreviousDayAvailability(schedule, day, previousSchedules);
    const blocks = [];

    if (previousAvailability?.slots?.length) {
        previousAvailability.slots.forEach(slot => {
            slotBusyBlocksForDay(slot, 'previous').forEach(block => {
                blocks.push(clampBlock(block, usefulStart, usefulEnd));
            });
        });
    }

    if (dayAvailability?.slots?.length) {
        dayAvailability.slots.forEach(slot => {
            slotBusyBlocksForDay(slot, 'same').forEach(block => {
                blocks.push(clampBlock(block, usefulStart, usefulEnd));
            });
        });
    }

    return mergeBlocks(blocks);
};

const invertBusyBlocks = (busyBlocks, usefulStart, usefulEnd) => {
    const freeBlocks = [];
    let cursor = usefulStart;

    busyBlocks.forEach(block => {
        if (cursor < block.start) {
            freeBlocks.push({ start: cursor, end: block.start });
        }
        cursor = Math.max(cursor, block.end);
    });

    if (cursor < usefulEnd) {
        freeBlocks.push({ start: cursor, end: usefulEnd });
    }

    return freeBlocks;
};

const isSegmentInsideBlock = (segment, block) =>
    segment.start >= block.start && segment.end <= block.end;

const getTimeQuality = (startMinutes, endMinutes) => {
    const midpoint = (startMinutes + endMinutes) / 2;
    if (midpoint < 12 * 60) return 'morning';
    if (midpoint < 17 * 60) return 'afternoon';
    if (midpoint < 22 * 60) return 'evening';
    return 'late';
};

const getTimeQualityScore = (timeQuality) => ({
    morning: 0.65,
    afternoon: 0.85,
    evening: 1,
    late: 0.45
}[timeQuality] || 0.65);

const scoreWindow = ({ window, date, memberCount, submittedMemberCount }) => {
    const startMinutes = window.start;
    const endMinutes = window.end;
    const durationMinutes = endMinutes - startMinutes;
    const availabilityRatio = window.availabilityPercentage / 100;
    const durationRatio = Math.min(durationMinutes / 180, 1);
    const timeQuality = getTimeQuality(startMinutes, endMinutes);
    const timeRatio = getTimeQualityScore(timeQuality);
    const weekday = new Date(`${date}T12:00:00`).getDay();
    const dayRatio = weekday === 5 || weekday === 6 ? 1 : weekday === 0 ? 0.9 : 0.65;
    const certaintyRatio = memberCount > 0 ? submittedMemberCount / memberCount : 0;
    const qualityScore = Math.round(
        (availabilityRatio * 45) +
        (durationRatio * 20) +
        (timeRatio * 20) +
        (dayRatio * 10) +
        (certaintyRatio * 5)
    );

    const scoreReasons = [];
    if (window.availabilityPercentage === 100) {
        scoreReasons.push('Todos pueden');
    } else {
        scoreReasons.push(`${window.availabilityPercentage}% del grupo puede`);
    }
    if (durationMinutes >= 180) {
        scoreReasons.push('Bloque largo');
    } else if (durationMinutes >= 120) {
        scoreReasons.push('Duracion suficiente');
    }
    if (timeQuality === 'evening') {
        scoreReasons.push('Horario tarde/noche');
    } else if (timeQuality === 'late') {
        scoreReasons.push('Horario tardio');
    }
    if (dayRatio >= 0.9) {
        scoreReasons.push('Buen dia de semana');
    }
    if (certaintyRatio < 1) {
        scoreReasons.push('Faltan horarios de algunos miembros');
    }

    return {
        qualityScore,
        scoreReasons,
        timeQuality
    };
};

const buildWindowsForDay = ({
    day,
    date,
    memberFreeBlocks,
    groupMembers,
    memberCount,
    submittedMemberCount,
    settings
}) => {
    const boundaries = new Set([
        timeToMinutes(settings.usefulStart),
        timeToMinutes(settings.usefulEnd)
    ]);

    memberFreeBlocks.forEach(memberData => {
        memberData.freeBlocks.forEach(block => {
            boundaries.add(block.start);
            boundaries.add(block.end);
        });
    });

    const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b);
    const rawWindows = [];

    for (let i = 0; i < sortedBoundaries.length - 1; i++) {
        const segment = {
            start: sortedBoundaries[i],
            end: sortedBoundaries[i + 1]
        };

        if (segment.end <= segment.start) continue;

        const availableMemberIds = memberFreeBlocks
            .filter(memberData =>
                memberData.freeBlocks.some(block => isSegmentInsideBlock(segment, block))
            )
            .map(memberData => memberData.userId);

        if (availableMemberIds.length === 0) continue;

        const availabilityPercentage = Math.round((availableMemberIds.length / memberCount) * 100);
        if (availabilityPercentage < settings.alternativeThreshold) continue;

        rawWindows.push({
            start: segment.start,
            end: segment.end,
            availableMemberIds,
            availabilityPercentage
        });
    }

    const mergedWindows = [];
    rawWindows.forEach(window => {
        const last = mergedWindows[mergedWindows.length - 1];
        const sameMembers = last &&
            last.availabilityPercentage === window.availabilityPercentage &&
            last.availableMemberIds.join('|') === window.availableMemberIds.join('|') &&
            last.end === window.start;

        if (sameMembers) {
            last.end = window.end;
        } else {
            mergedWindows.push({ ...window });
        }
    });

    const allMemberIds = groupMembers.map(getMemberId).filter(Boolean);

    return mergedWindows
        .map(window => {
            const unavailableMemberIds = allMemberIds.filter(
                memberId => !window.availableMemberIds.includes(memberId)
            );

            const scored = scoreWindow({
                window,
                date,
                memberCount,
                submittedMemberCount
            });

            return {
                day,
                date,
                start: minutesToTime(window.start),
                end: minutesToTime(window.end),
                durationMinutes: window.end - window.start,
                availabilityPercentage: window.availabilityPercentage,
                qualityScore: scored.qualityScore,
                scoreReasons: scored.scoreReasons,
                timeQuality: scored.timeQuality,
                availableMembers: groupMembers
                    .filter(member => window.availableMemberIds.includes(getMemberId(member)))
                    .map(member => ({
                        userId: getMemberId(member),
                        username: member.user.username || member.user.email,
                        fullName: member.user.fullName
                    })),
                unavailableMembers: groupMembers
                    .filter(member => unavailableMemberIds.includes(getMemberId(member)))
                    .map(member => ({
                        userId: getMemberId(member),
                        username: member.user.username || member.user.email,
                        fullName: member.user.fullName
                    }))
            };
        })
        .filter(window => window.durationMinutes >= settings.minimumBlockMinutes);
};

const sortWindows = (a, b) => {
    const aPerfect = a.availabilityPercentage === 100;
    const bPerfect = b.availabilityPercentage === 100;
    if (aPerfect !== bPerfect) return aPerfect ? -1 : 1;
    if ((b.qualityScore || 0) !== (a.qualityScore || 0)) {
        return (b.qualityScore || 0) - (a.qualityScore || 0);
    }
    if (b.availabilityPercentage !== a.availabilityPercentage) {
        return b.availabilityPercentage - a.availabilityPercentage;
    }
    if (b.durationMinutes !== a.durationMinutes) {
        return b.durationMinutes - a.durationMinutes;
    }
    return timeToMinutes(a.start) - timeToMinutes(b.start);
};

const buildDaySummary = (day, year, month, schedules, previousSchedules, groupMembers, settings, submittedMemberIds) => {
    const usefulStart = timeToMinutes(settings.usefulStart);
    const usefulEnd = timeToMinutes(settings.usefulEnd);
    const date = new Date(year, month - 1, day).toISOString().slice(0, 10);

    const memberFreeBlocks = schedules.map(schedule => {
        const busyBlocks = getBusyBlocksForDay(
            schedule,
            day,
            previousSchedules,
            usefulStart,
            usefulEnd
        );

        return {
            userId: schedule.user._id.toString(),
            member: memberInfoFromSchedule(schedule),
            busyBlocks,
            freeBlocks: invertBusyBlocks(busyBlocks, usefulStart, usefulEnd)
        };
    });

    const windows = buildWindowsForDay({
        day,
        date,
        memberFreeBlocks,
        groupMembers,
        memberCount: groupMembers.length,
        submittedMemberCount: submittedMemberIds.size,
        settings
    }).sort(sortWindows);

    const perfectWindows = windows.filter(window => window.availabilityPercentage === 100);
    const alternativeWindows = windows.filter(window => window.availabilityPercentage < 100);
    const bestWindow = windows[0] || null;

    return {
        day,
        date,
        bestWindow,
        perfectWindows,
        alternativeWindows,
        availabilityScore: bestWindow?.availabilityPercentage || 0,
        memberSummaries: memberFreeBlocks.map(memberData => ({
            ...memberData.member,
            busyBlocks: memberData.busyBlocks.map(block => ({
                start: minutesToTime(block.start),
                end: minutesToTime(block.end)
            })),
            freeBlocks: memberData.freeBlocks.map(block => ({
                start: minutesToTime(block.start),
                end: minutesToTime(block.end),
                durationMinutes: block.end - block.start
            }))
        }))
    };
};

export const calculateGroupAvailabilityData = async ({ groupId, userId, month, year }) => {
    const parsedMonth = parseInt(month);
    const parsedYear = parseInt(year);

    const group = await Group.findById(groupId).populate('members.user', 'username email fullName');
    if (!group) {
        const error = new Error('Grupo no encontrado');
        error.statusCode = 404;
        throw error;
    }

    const groupMembers = group.members.filter(member => getMemberId(member));
    const isMember = groupMembers.some(
        member => getMemberId(member) === userId
    );

    if (!isMember) {
        const error = new Error('No eres miembro de este grupo');
        error.statusCode = 403;
        throw error;
    }

    const memberIds = groupMembers.map(member => getMemberId(member));

    for (const memberId of memberIds) {
        await Schedule.getOrCreate(memberId, parsedYear, parsedMonth);
    }

    const schedules = await Schedule.find({
        user: { $in: memberIds },
        month: parsedMonth,
        year: parsedYear
    }).populate('user', 'username email fullName');

    const previousDate = new Date(parsedYear, parsedMonth - 2, 1);
    const previousSchedules = await Schedule.find({
        user: { $in: memberIds },
        month: previousDate.getMonth() + 1,
        year: previousDate.getFullYear()
    });

    const settings = getEffectiveSettings(group);
    const submittedMemberIds = new Set(
        schedules
            .filter(schedule =>
                schedule.availability?.some(dayAvailability => dayAvailability.slots?.length > 0)
            )
            .map(schedule => schedule.user._id.toString())
    );
    const daysInMonth = new Date(parsedYear, parsedMonth, 0).getDate();
    const days = [];

    for (let day = 1; day <= daysInMonth; day++) {
        days.push(buildDaySummary(
            day,
            parsedYear,
            parsedMonth,
            schedules,
            previousSchedules,
            groupMembers,
            settings,
            submittedMemberIds
        ));
    }

    const recommendations = days
        .flatMap(day => [
            ...day.perfectWindows.map(window => ({ ...window, type: 'perfect' })),
            ...day.alternativeWindows.map(window => ({ ...window, type: 'alternative' }))
        ])
        .sort((a, b) => {
            if (a.type !== b.type) return a.type === 'perfect' ? -1 : 1;
            if ((b.qualityScore || 0) !== (a.qualityScore || 0)) {
                return (b.qualityScore || 0) - (a.qualityScore || 0);
            }
            if (b.availabilityPercentage !== a.availabilityPercentage) {
                return b.availabilityPercentage - a.availabilityPercentage;
            }
            if (b.durationMinutes !== a.durationMinutes) {
                return b.durationMinutes - a.durationMinutes;
            }
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        });

    const stats = {
        totalDays: daysInMonth,
        daysWithPerfectOption: days.filter(day => day.perfectWindows.length > 0).length,
        daysWithStrongAlternative: days.filter(day => day.alternativeWindows.length > 0).length,
        totalRecommendations: recommendations.length,
        memberCount: groupMembers.length,
        schedulesSubmitted: submittedMemberIds.size
    };

    return {
        groupId,
        groupName: group.name,
        month: parsedMonth,
        year: parsedYear,
        settings,
        recommendations,
        days,
        availability: days,
        stats
    };
};

export const getGroupAvailability = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(400).json({
                success: false,
                message: 'Mes y año son requeridos'
            });
        }

        const data = await calculateGroupAvailabilityData({
            groupId,
            userId: req.userId,
            month,
            year
        });

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error al obtener disponibilidad grupal:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Error al obtener disponibilidad grupal'
        });
    }
};
