import { calculateGroupAvailabilityData } from './availabilityController.js';
import { fetchEventSuggestions } from '../services/eventSuggestionService.js';

const parseMonthParam = (value) => {
    if (!value || !/^\d{4}-\d{2}$/.test(value)) {
        return null;
    }
    const [year, month] = value.split('-').map(Number);
    if (month < 1 || month > 12) {
        return null;
    }
    return { year, month };
};

const parseListParam = (value) => {
    if (!value) return undefined;
    const values = Array.isArray(value) ? value : String(value).split(',');
    const cleaned = values.map(item => String(item).trim()).filter(Boolean);
    return cleaned.length > 0 ? cleaned : undefined;
};

const parseBooleanParam = (value, defaultValue = false) => {
    if (value === undefined || value === null || value === '') return defaultValue;
    return ['true', '1', 'yes', 'si'].includes(String(value).toLowerCase());
};

const timeToMinutes = (value) => {
    if (!value || !/^\d{2}:\d{2}$/.test(value)) {
        return null;
    }
    const [hours, minutes] = value.split(':').map(Number);
    return hours * 60 + minutes;
};

const getEventMatchingWindows = (event, windows, includeUnknownTime) => {
    if (!event.timeLocal) {
        return includeUnknownTime ? windows : [];
    }

    const eventMinutes = timeToMinutes(event.timeLocal);
    if (eventMinutes === null) {
        return includeUnknownTime ? windows : [];
    }

    return windows.filter(window => {
        const startMinutes = timeToMinutes(window.start);
        const endMinutes = timeToMinutes(window.end);

        if (startMinutes === null || endMinutes === null) {
            return false;
        }

        if (startMinutes <= endMinutes) {
            return eventMinutes >= startMinutes && eventMinutes <= endMinutes;
        }

        return eventMinutes >= startMinutes || eventMinutes <= endMinutes;
    });
};

export const getGroupEventSuggestions = async (req, res) => {
    try {
        const { id } = req.params;
        const parsedMonth = parseMonthParam(req.query.month);

        if (!parsedMonth) {
            return res.status(400).json({
                success: false,
                message: 'El parametro month debe usar formato YYYY-MM'
            });
        }

        const categories = parseListParam(req.query.categories || req.query.category);
        const sources = parseListParam(req.query.source || req.query.sources);
        const includeAlternatives = parseBooleanParam(req.query.includeAlternatives, true);
        const includeUnknownTime = parseBooleanParam(req.query.includeUnknownTime, false);
        const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);

        const availability = await calculateGroupAvailabilityData({
            groupId: id,
            userId: req.userId,
            month: parsedMonth.month,
            year: parsedMonth.year
        });

        const usefulDays = availability.days
            .map(day => {
                const windows = [
                    ...day.perfectWindows.map(window => ({ ...window, type: 'perfect' })),
                    ...(includeAlternatives
                        ? day.alternativeWindows.map(window => ({ ...window, type: 'alternative' }))
                        : [])
                ];

                return {
                    date: day.date,
                    availabilityWindow: day.bestWindow,
                    windows
                };
            })
            .filter(day => day.windows.length > 0)
            .map(day => ({
                date: day.date,
                availabilityWindow: day.availabilityWindow,
                windows: day.windows
            }));

        if (usefulDays.length === 0) {
            return res.json({
                success: true,
                data: {
                    groupId: id,
                    month: parsedMonth.month,
                    year: parsedMonth.year,
                    available: true,
                    days: [],
                    totalEvents: 0
                }
            });
        }

        const suggestions = await fetchEventSuggestions({
            dates: usefulDays.map(day => day.date),
            city: req.query.city,
            categories,
            limit
        });

        const eventDaysByDate = new Map(
            suggestions.days.map(day => [day.date, day.events || []])
        );

        const days = usefulDays.map(day => {
            const events = eventDaysByDate.get(day.date) || [];
            const filteredEvents = events
                .filter(event => !sources || sources.includes(event.source))
                .map(event => {
                    const matchingWindows = getEventMatchingWindows(
                        event,
                        day.windows,
                        includeUnknownTime
                    );
                    if (matchingWindows.length === 0) return null;

                    const bestMatch = matchingWindows
                        .slice()
                        .sort((a, b) => {
                            if (a.type !== b.type) return a.type === 'perfect' ? -1 : 1;
                            if ((b.qualityScore || 0) !== (a.qualityScore || 0)) {
                                return (b.qualityScore || 0) - (a.qualityScore || 0);
                            }
                            return b.availabilityPercentage - a.availabilityPercentage;
                        })[0];

                    return {
                        ...event,
                        matchingWindows,
                        matchType: bestMatch.type || (bestMatch.availabilityPercentage === 100 ? 'perfect' : 'alternative'),
                        availabilityPercentage: bestMatch.availabilityPercentage
                    };
                })
                .filter(Boolean);

            return {
                date: day.date,
                availabilityWindow: day.availabilityWindow,
                windows: day.windows,
                events: filteredEvents
            };
        });

        res.json({
            success: true,
            data: {
                groupId: id,
                month: parsedMonth.month,
                year: parsedMonth.year,
                available: suggestions.available,
                message: suggestions.message,
                totalEvents: days.reduce((total, day) => total + day.events.length, 0),
                days
            }
        });
    } catch (error) {
        console.error('Error al obtener eventos sugeridos:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Error al obtener eventos sugeridos'
        });
    }
};
