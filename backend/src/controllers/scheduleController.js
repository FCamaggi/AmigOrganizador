import Schedule from '../models/Schedule.js';

/**
 * Obtener horario de un mes específico
 * GET /api/schedules/:year/:month
 */
export const getSchedule = async (req, res) => {
    try {
        const { year, month } = req.params;
        const userId = req.userId;

        const schedule = await Schedule.getOrCreate(userId, parseInt(year), parseInt(month));

        res.json({
            success: true,
            data: schedule
        });
    } catch (error) {
        console.error('Error al obtener horario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener horario',
            error: error.message
        });
    }
};

/**
 * Actualizar disponibilidad de un día específico
 * PUT /api/schedules/:year/:month/:day
 */
export const updateDayAvailability = async (req, res) => {
    try {
        const { year, month, day } = req.params;
        const { slots, note } = req.body;
        const userId = req.userId;

        // Validar slots
        if (!Array.isArray(slots)) {
            return res.status(400).json({
                success: false,
                message: 'Los slots deben ser un array'
            });
        }

        // Validar formato de slots
        // Interpretación automática de turnos:
        // - start < end: Mismo día (ej: 08:00-20:00 = 12 horas)
        // - start > end: Cruza medianoche (ej: 20:00-08:00 = 12 horas al día siguiente)
        // - start === end: Turno completo de 24 horas (ej: 08:00-08:00 = 24 horas)
        for (const slot of slots) {
            if (!slot.start || !slot.end) {
                return res.status(400).json({
                    success: false,
                    message: 'Cada slot debe tener start y end'
                });
            }

            // Validar formato HH:MM
            const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
            if (!timeRegex.test(slot.start) || !timeRegex.test(slot.end)) {
                return res.status(400).json({
                    success: false,
                    message: 'Formato de hora inválido. Use HH:MM (00:00-23:59)'
                });
            }
        }

        const schedule = await Schedule.getOrCreate(userId, parseInt(year), parseInt(month));
        await schedule.updateDayAvailability(parseInt(day), slots, note || '');

        res.json({
            success: true,
            data: schedule
        });
    } catch (error) {
        console.error('Error al actualizar disponibilidad:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar disponibilidad',
            error: error.message
        });
    }
};

/**
 * Eliminar disponibilidad de un día específico
 * DELETE /api/schedules/:year/:month/:day
 */
export const removeDayAvailability = async (req, res) => {
    try {
        const { year, month, day } = req.params;
        const userId = req.userId;

        const schedule = await Schedule.getOrCreate(userId, parseInt(year), parseInt(month));
        await schedule.removeDayAvailability(parseInt(day));

        res.json({
            success: true,
            data: schedule
        });
    } catch (error) {
        console.error('Error al eliminar disponibilidad:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar disponibilidad',
            error: error.message
        });
    }
};

/**
 * Obtener disponibilidad de múltiples meses (para visualización)
 * GET /api/schedules/range/:startYear/:startMonth/:endYear/:endMonth
 */
export const getScheduleRange = async (req, res) => {
    try {
        const { startYear, startMonth, endYear, endMonth } = req.params;
        const userId = req.userId;

        const schedules = [];
        let currentYear = parseInt(startYear);
        let currentMonth = parseInt(startMonth);
        const finalYear = parseInt(endYear);
        const finalMonth = parseInt(endMonth);

        while (currentYear < finalYear || (currentYear === finalYear && currentMonth <= finalMonth)) {
            const schedule = await Schedule.findOne({
                user: userId,
                year: currentYear,
                month: currentMonth
            });

            if (schedule) {
                schedules.push(schedule);
            }

            // Avanzar al siguiente mes
            currentMonth++;
            if (currentMonth > 12) {
                currentMonth = 1;
                currentYear++;
            }
        }

        res.json({
            success: true,
            data: schedules
        });
    } catch (error) {
        console.error('Error al obtener rango de horarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener rango de horarios',
            error: error.message
        });
    }
};

/**
 * Exportar horario a JSON
 * GET /api/schedules/:year/:month/export
 */
export const exportSchedule = async (req, res) => {
    try {
        const { year, month } = req.params;
        const userId = req.userId;

        const schedule = await Schedule.findOne({
            user: userId,
            year: parseInt(year),
            month: parseInt(month)
        });

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró horario para este mes'
            });
        }

        res.json({
            success: true,
            data: {
                year: schedule.year,
                month: schedule.month,
                availability: schedule.availability,
                exportedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error al exportar horario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al exportar horario',
            error: error.message
        });
    }
};

/**
 * Importar horario desde JSON
 * POST /api/schedules/import
 */
export const importSchedule = async (req, res) => {
    try {
        const { year, month, availability } = req.body;
        const userId = req.userId;

        if (!year || !month || !Array.isArray(availability)) {
            return res.status(400).json({
                success: false,
                message: 'Datos de importación inválidos'
            });
        }

        // Validar estructura completa antes de guardar
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        const days = new Set();

        for (const dayAvail of availability) {
            // Validar día
            if (!dayAvail.day || dayAvail.day < 1 || dayAvail.day > 31) {
                return res.status(400).json({
                    success: false,
                    message: `Día inválido: ${dayAvail.day}. Debe estar entre 1 y 31`
                });
            }

            // Validar días duplicados
            if (days.has(dayAvail.day)) {
                return res.status(400).json({
                    success: false,
                    message: `Día duplicado encontrado: ${dayAvail.day}`
                });
            }
            days.add(dayAvail.day);

            // Validar slots
            if (!Array.isArray(dayAvail.slots)) {
                return res.status(400).json({
                    success: false,
                    message: `Slots debe ser un array para el día ${dayAvail.day}`
                });
            }

            for (const slot of dayAvail.slots) {
                if (!slot.start || !slot.end) {
                    return res.status(400).json({
                        success: false,
                        message: `Cada slot debe tener start y end (día ${dayAvail.day})`
                    });
                }

                // Validar formato HH:MM
                // Interpretación automática:
                // - start < end: Mismo día (08:00-20:00)
                // - start > end: Cruza medianoche (20:00-08:00)
                // - start === end: Turno 24h (08:00-08:00)
                if (!timeRegex.test(slot.start) || !timeRegex.test(slot.end)) {
                    return res.status(400).json({
                        success: false,
                        message: `Formato de hora inválido en día ${dayAvail.day}. Use HH:MM (00:00-23:59)`
                    });
                }

                // Validar color si existe
                if (slot.color && !/^#[0-9A-Fa-f]{6}$/.test(slot.color)) {
                    return res.status(400).json({
                        success: false,
                        message: `Color inválido en día ${dayAvail.day}. Use formato hexadecimal #RRGGBB`
                    });
                }
            }
        }

        const schedule = await Schedule.getOrCreate(userId, parseInt(year), parseInt(month));
        schedule.availability = availability;
        await schedule.save();

        res.json({
            success: true,
            data: schedule,
            message: 'Horario importado exitosamente'
        });
    } catch (error) {
        console.error('Error al importar horario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al importar horario',
            error: error.message
        });
    }
};
