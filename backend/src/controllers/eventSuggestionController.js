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

        const availability = await calculateGroupAvailabilityData({
            groupId: id,
            userId: req.userId,
            month: parsedMonth.month,
            year: parsedMonth.year
        });

        const usefulDays = availability.days
            .filter(day => day.bestWindow)
            .map(day => ({
                date: day.date,
                availabilityWindow: day.bestWindow
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
            city: req.query.city || 'Santiago',
            limit: Number(req.query.limit) || 20
        });

        const eventDaysByDate = new Map(
            suggestions.days.map(day => [day.date, day.events || []])
        );

        res.json({
            success: true,
            data: {
                groupId: id,
                month: parsedMonth.month,
                year: parsedMonth.year,
                available: suggestions.available,
                message: suggestions.message,
                totalEvents: suggestions.totalEvents,
                days: usefulDays.map(day => ({
                    date: day.date,
                    availabilityWindow: day.availabilityWindow,
                    events: eventDaysByDate.get(day.date) || []
                }))
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
