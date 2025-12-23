import Group from '../models/Group.js';
import Event from '../models/Event.js';

/**
 * Vista simple: Obtener días con ventanas libres para todos los miembros
 * GET /api/groups/:id/availability/simple?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export const getSimpleAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.query;
        const userId = req.userId;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Se requieren fechas de inicio y fin'
            });
        }

        const group = await Group.findById(id);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Grupo no encontrado'
            });
        }

        // Verificar que el usuario es miembro
        const isMember = group.members.some(member => {
            const memberId = member.user._id ? member.user._id.toString() : member.user.toString();
            return memberId === userId.toString();
        });

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: 'No tienes acceso a este grupo'
            });
        }

        const minimumHours = group.settings.minimumAvailabilityHours || 2;
        const memberIds = group.members.map(m => m.user._id || m.user);

        // Obtener todos los eventos de todos los miembros en el rango
        const allEvents = await Event.find({
            user: { $in: memberIds },
            startDate: { $lte: new Date(endDate) },
            endDate: { $gte: new Date(startDate) }
        });

        // Agrupar eventos por usuario
        const eventsByUser = {};
        memberIds.forEach(memberId => {
            eventsByUser[memberId.toString()] = allEvents.filter(
                e => e.user.toString() === memberId.toString()
            );
        });

        // Analizar cada día en el rango
        const start = new Date(startDate);
        const end = new Date(endDate);
        const availableDays = [];

        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            const dayAvailability = analyzeDayAvailability(
                date,
                eventsByUser,
                memberIds,
                minimumHours
            );

            if (dayAvailability.hasCommonAvailability) {
                availableDays.push({
                    date: new Date(date),
                    ...dayAvailability
                });
            }
        }

        res.json({
            success: true,
            data: {
                minimumHours,
                totalDays: availableDays.length,
                availableDays
            }
        });
    } catch (error) {
        console.error('Error al obtener disponibilidad simple:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener disponibilidad',
            error: error.message
        });
    }
};

/**
 * Vista detallada: Obtener horas exactas disponibles para todos
 * GET /api/groups/:id/availability/detailed?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export const getDetailedAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.query;
        const userId = req.userId;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Se requieren fechas de inicio y fin'
            });
        }

        const group = await Group.findById(id).populate('members.user', 'username email fullName');
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Grupo no encontrado'
            });
        }

        // Verificar que el usuario es miembro
        const isMember = group.members.some(member => {
            const memberId = member.user._id ? member.user._id.toString() : member.user.toString();
            return memberId === userId.toString();
        });

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: 'No tienes acceso a este grupo'
            });
        }

        const memberIds = group.members.map(m => m.user._id || m.user);

        // Obtener todos los eventos de todos los miembros en el rango
        const allEvents = await Event.find({
            user: { $in: memberIds },
            startDate: { $lte: new Date(endDate) },
            endDate: { $gte: new Date(startDate) }
        });

        // Agrupar eventos por usuario
        const eventsByUser = {};
        memberIds.forEach(memberId => {
            eventsByUser[memberId.toString()] = allEvents.filter(
                e => e.user.toString() === memberId.toString()
            );
        });

        // Analizar cada día en el rango
        const start = new Date(startDate);
        const end = new Date(endDate);
        const detailedAvailability = [];

        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            const dayDetail = getDetailedDayAvailability(
                date,
                eventsByUser,
                memberIds,
                group.members
            );

            detailedAvailability.push({
                date: new Date(date),
                ...dayDetail
            });
        }

        res.json({
            success: true,
            data: {
                members: group.members.map(m => ({
                    userId: m.user._id,
                    username: m.user.username,
                    fullName: m.user.fullName
                })),
                availability: detailedAvailability
            }
        });
    } catch (error) {
        console.error('Error al obtener disponibilidad detallada:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener disponibilidad',
            error: error.message
        });
    }
};

/**
 * Analizar si un día tiene disponibilidad común (vista simple)
 */
function analyzeDayAvailability(date, eventsByUser, memberIds, minimumHours) {
    // Obtener disponibilidad de cada miembro para este día
    const memberAvailabilities = memberIds.map(memberId => {
        const userEvents = eventsByUser[memberId.toString()] || [];
        const busySlots = [];

        userEvents.forEach(event => {
            if (event.isActiveOnDate(date)) {
                const slots = event.getTimeSlotsForDate(date);
                busySlots.push(...slots);
            }
        });

        return calculateAvailableSlots(busySlots);
    });

    // Encontrar intersección de disponibilidad
    const commonAvailability = findCommonTimeSlots(memberAvailabilities);

    // Filtrar por ventanas de al menos X horas
    const validWindows = commonAvailability.filter(slot => {
        const duration = calculateSlotDuration(slot);
        return duration >= minimumHours;
    });

    return {
        hasCommonAvailability: validWindows.length > 0,
        commonTimeSlots: validWindows,
        totalAvailableHours: validWindows.reduce((sum, slot) => sum + calculateSlotDuration(slot), 0)
    };
}

/**
 * Obtener disponibilidad detallada por día (vista detallada)
 */
function getDetailedDayAvailability(date, eventsByUser, memberIds, memberInfo) {
    const memberDetails = [];

    memberIds.forEach((memberId, index) => {
        const userEvents = eventsByUser[memberId.toString()] || [];
        const busySlots = [];

        userEvents.forEach(event => {
            if (event.isActiveOnDate(date)) {
                const slots = event.getTimeSlotsForDate(date);
                busySlots.push(...slots.map(slot => ({
                    ...slot,
                    title: event.title,
                    category: event.category,
                    color: event.color
                })));
            }
        });

        const availableSlots = calculateAvailableSlots(busySlots);

        memberDetails.push({
            userId: memberId,
            username: memberInfo[index]?.user?.username,
            busySlots,
            availableSlots,
            totalBusyHours: busySlots.reduce((sum, slot) => sum + calculateSlotDuration(slot), 0),
            totalAvailableHours: availableSlots.reduce((sum, slot) => sum + calculateSlotDuration(slot), 0)
        });
    });

    // Calcular disponibilidad común
    const allAvailabilities = memberDetails.map(m => m.availableSlots);
    const commonTimeSlots = findCommonTimeSlots(allAvailabilities);

    return {
        memberDetails,
        commonTimeSlots,
        totalCommonHours: commonTimeSlots.reduce((sum, slot) => sum + calculateSlotDuration(slot), 0),
        allMembersAvailable: commonTimeSlots.length > 0
    };
}

/**
 * Encontrar intersección de slots de tiempo
 */
function findCommonTimeSlots(availabilitiesArray) {
    if (availabilitiesArray.length === 0) return [];
    if (availabilitiesArray.length === 1) return availabilitiesArray[0];

    let common = availabilitiesArray[0];

    for (let i = 1; i < availabilitiesArray.length; i++) {
        common = intersectTimeSlots(common, availabilitiesArray[i]);
        if (common.length === 0) break;
    }

    return common;
}

/**
 * Calcular intersección entre dos arrays de slots
 */
function intersectTimeSlots(slots1, slots2) {
    const intersections = [];

    slots1.forEach(slot1 => {
        const start1 = timeToMinutes(slot1.start);
        const end1 = timeToMinutes(slot1.end);

        slots2.forEach(slot2 => {
            const start2 = timeToMinutes(slot2.start);
            const end2 = timeToMinutes(slot2.end);

            const overlapStart = Math.max(start1, start2);
            const overlapEnd = Math.min(end1, end2);

            if (overlapStart < overlapEnd) {
                intersections.push({
                    start: minutesToTime(overlapStart),
                    end: minutesToTime(overlapEnd)
                });
            }
        });
    });

    return mergeOverlappingSlots(intersections);
}

/**
 * Mergear slots superpuestos
 */
function mergeOverlappingSlots(slots) {
    if (slots.length === 0) return [];

    const sorted = slots
        .map(slot => ({
            start: timeToMinutes(slot.start),
            end: timeToMinutes(slot.end)
        }))
        .sort((a, b) => a.start - b.start);

    const merged = [];
    let current = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].start <= current.end) {
            current.end = Math.max(current.end, sorted[i].end);
        } else {
            merged.push(current);
            current = sorted[i];
        }
    }
    merged.push(current);

    return merged.map(slot => ({
        start: minutesToTime(slot.start),
        end: minutesToTime(slot.end)
    }));
}

/**
 * Calcular slots disponibles basados en los ocupados
 */
function calculateAvailableSlots(busySlots) {
    if (busySlots.length === 0) {
        return [{ start: '00:00', end: '23:59' }];
    }

    const merged = mergeOverlappingSlots(busySlots);
    const available = [];
    let lastEnd = 0;

    merged.forEach(slot => {
        const slotStart = timeToMinutes(slot.start);
        if (slotStart > lastEnd) {
            available.push({
                start: minutesToTime(lastEnd),
                end: minutesToTime(slotStart)
            });
        }
        lastEnd = timeToMinutes(slot.end);
    });

    if (lastEnd < 1439) {
        available.push({
            start: minutesToTime(lastEnd),
            end: '23:59'
        });
    }

    return available;
}

/**
 * Calcular duración de un slot en horas
 */
function calculateSlotDuration(slot) {
    const start = timeToMinutes(slot.start);
    const end = timeToMinutes(slot.end);
    return (end - start) / 60;
}

/**
 * Convertir tiempo HH:MM a minutos desde medianoche
 */
function timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * Convertir minutos desde medianoche a HH:MM
 */
function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export default {
    getSimpleAvailability,
    getDetailedAvailability
};
