import Event from '../models/Event.js';
import UserTemplate from '../models/UserTemplate.js';

/**
 * Crear un nuevo evento
 * POST /api/events
 */
export const createEvent = async (req, res) => {
    try {
        const userId = req.userId;
        const {
            title,
            description,
            category,
            userTemplateId,
            color,
            startDate,
            endDate,
            timeSlots,
            allDay,
            recurrence
        } = req.body;

        // Validaciones básicas
        if (!title || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Título, fecha de inicio y fecha de fin son requeridos'
            });
        }

        // Crear datos del evento
        let eventData = {
            user: userId,
            title,
            description,
            category: category || 'custom',
            color: color || '#6b7280',
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            timeSlots: timeSlots || [],
            allDay: allDay || false,
            recurrence: recurrence || { enabled: false }
        };

        // Si se especifica una plantilla de usuario, aplicar sus datos por defecto
        if (userTemplateId) {
            const userTemplate = await UserTemplate.findOne({ _id: userTemplateId, user: userId });
            if (userTemplate) {
                eventData.userTemplate = userTemplate._id;
                eventData.category = userTemplate.category;
                eventData.color = color || userTemplate.color;
                if (!timeSlots || timeSlots.length === 0) {
                    eventData.timeSlots = userTemplate.defaultSlots;
                }
            }
        }

        const event = await Event.create(eventData);

        res.status(201).json({
            success: true,
            data: event,
            message: 'Evento creado exitosamente'
        });
    } catch (error) {
        console.error('Error al crear evento:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear evento',
            error: error.message
        });
    }
};

/**
 * Obtener eventos del usuario en un rango de fechas
 * GET /api/events?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export const getEvents = async (req, res) => {
    try {
        const userId = req.userId;
        const { startDate, endDate, category } = req.query;

        // Construir filtro
        const filter = { user: userId };

        if (startDate && endDate) {
            filter.$or = [
                // Eventos que comienzan en el rango
                {
                    startDate: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    }
                },
                // Eventos que terminan en el rango
                {
                    endDate: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    }
                },
                // Eventos que abarcan todo el rango
                {
                    startDate: { $lte: new Date(startDate) },
                    endDate: { $gte: new Date(endDate) }
                }
            ];
        }

        if (category) {
            filter.category = category;
        }

        const events = await Event.find(filter).sort({ startDate: 1 });

        res.json({
            success: true,
            data: events
        });
    } catch (error) {
        console.error('Error al obtener eventos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener eventos',
            error: error.message
        });
    }
};

/**
 * Obtener un evento por ID
 * GET /api/events/:id
 */
export const getEventById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const event = await Event.findOne({ _id: id, user: userId });

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Evento no encontrado'
            });
        }

        res.json({
            success: true,
            data: event
        });
    } catch (error) {
        console.error('Error al obtener evento:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener evento',
            error: error.message
        });
    }
};

/**
 * Actualizar un evento
 * PUT /api/events/:id
 */
export const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const updateData = req.body;

        // Buscar el evento
        const event = await Event.findOne({ _id: id, user: userId });

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Evento no encontrado'
            });
        }

        // Actualizar campos permitidos
        const allowedFields = [
            'title',
            'description',
            'category',
            'template',
            'color',
            'startDate',
            'endDate',
            'timeSlots',
            'allDay',
            'recurrence'
        ];

        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                event[field] = updateData[field];
            }
        });

        await event.save();

        res.json({
            success: true,
            data: event,
            message: 'Evento actualizado exitosamente'
        });
    } catch (error) {
        console.error('Error al actualizar evento:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar evento',
            error: error.message
        });
    }
};

/**
 * Eliminar un evento
 * DELETE /api/events/:id
 */
export const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const event = await Event.findOneAndDelete({ _id: id, user: userId });

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Evento no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Evento eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar evento:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar evento',
            error: error.message
        });
    }
};

/**
 * Obtener disponibilidad del usuario para un día específico
 * GET /api/events/availability/:date
 */
export const getAvailabilityForDate = async (req, res) => {
    try {
        const userId = req.userId;
        const { date } = req.params;
        const targetDate = new Date(date);

        // Obtener todos los eventos que podrían afectar esta fecha
        const events = await Event.find({
            user: userId,
            startDate: { $lte: targetDate },
            endDate: { $gte: targetDate }
        });

        // Filtrar eventos activos en esta fecha y obtener sus slots
        const busySlots = [];
        events.forEach(event => {
            if (event.isActiveOnDate(targetDate)) {
                const slots = event.getTimeSlotsForDate(targetDate);
                busySlots.push(...slots.map(slot => ({
                    ...slot,
                    eventId: event._id,
                    category: event.category,
                    title: event.title,
                    color: event.color
                })));
            }
        });

        res.json({
            success: true,
            data: {
                date: targetDate,
                busySlots,
                availableSlots: calculateAvailableSlots(busySlots)
            }
        });
    } catch (error) {
        console.error('Error al obtener disponibilidad:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener disponibilidad',
            error: error.message
        });
    }
};

/**
 * Calcular slots disponibles basados en los ocupados
 */
function calculateAvailableSlots(busySlots) {
    if (busySlots.length === 0) {
        return [{ start: '00:00', end: '23:59' }];
    }

    // Ordenar slots por hora de inicio
    const sorted = busySlots
        .map(slot => ({
            start: timeToMinutes(slot.start),
            end: timeToMinutes(slot.end)
        }))
        .sort((a, b) => a.start - b.start);

    // Mergear slots superpuestos
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

    // Calcular gaps (disponibilidad)
    const available = [];
    let lastEnd = 0; // 00:00

    merged.forEach(slot => {
        if (slot.start > lastEnd) {
            available.push({
                start: minutesToTime(lastEnd),
                end: minutesToTime(slot.start)
            });
        }
        lastEnd = slot.end;
    });

    // Agregar tiempo después del último evento hasta medianoche
    if (lastEnd < 1439) { // 23:59
        available.push({
            start: minutesToTime(lastEnd),
            end: '23:59'
        });
    }

    return available;
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
