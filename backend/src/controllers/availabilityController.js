import Schedule from '../models/Schedule.js';
import Group from '../models/Group.js';

/**
 * Obtener disponibilidad grupal para un mes específico
 * Calcula la disponibilidad común entre todos los miembros del grupo
 */
export const getGroupAvailability = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { month, year } = req.query;

        // Validar parámetros
        if (!month || !year) {
            return res.status(400).json({
                success: false,
                message: 'Mes y año son requeridos'
            });
        }

        // Verificar que el grupo existe y el usuario es miembro
        const group = await Group.findById(groupId).populate('members.user');
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Grupo no encontrado'
            });
        }

        const isMember = group.members.some(
            member => member.user._id.toString() === req.userId
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: 'No eres miembro de este grupo'
            });
        }

        // Obtener todos los horarios de los miembros para el mes especificado
        const memberIds = group.members.map(member => member.user._id);
        
        // Crear schedules vacíos para miembros que no tienen uno (para contar como "enviado")
        for (const memberId of memberIds) {
            await Schedule.getOrCreate(memberId, parseInt(year), parseInt(month));
        }
        
        const schedules = await Schedule.find({
            user: { $in: memberIds },
            month: parseInt(month),
            year: parseInt(year)
        }).populate('user', 'username email fullName');

        // Crear un mapa de disponibilidad por día
        const availabilityMap = {};
        const memberCount = group.members.length;

        // Inicializar el mapa con todos los días del mes
        const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            availabilityMap[day] = {
                day,
                availableMembers: [],
                unavailableMembers: [],
                availabilityPercentage: 0,
                timeSlots: []
            };
        }

        // Procesar cada miembro para todos los días del mes
        schedules.forEach(schedule => {
            // Para cada día del mes, verificar si el miembro tiene eventos
            for (let day = 1; day <= daysInMonth; day++) {
                const dayAvailability = schedule.availability.find(a => a.day === day);
                const hasEvents = dayAvailability && dayAvailability.slots && dayAvailability.slots.length > 0;
                
                const memberInfo = {
                    userId: schedule.user._id,
                    username: schedule.user.username || schedule.user.email,
                    fullName: schedule.user.fullName,
                    slots: dayAvailability?.slots || [],
                    note: dayAvailability?.note
                };

                // Un miembro está DISPONIBLE si NO tiene eventos (slots) ese día
                if (!hasEvents) {
                    availabilityMap[day].availableMembers.push(memberInfo);
                }
            }
        });

        // Calcular miembros no disponibles y porcentaje
        Object.keys(availabilityMap).forEach(day => {
            const dayData = availabilityMap[day];
            const availableIds = dayData.availableMembers.map(m => m.userId.toString());

            // Obtener miembros no disponibles con sus eventos
            dayData.unavailableMembers = group.members
                .filter(member => !availableIds.includes(member.user._id.toString()))
                .map(member => {
                    // Buscar el schedule de este miembro
                    const memberSchedule = schedules.find(s => s.user._id.toString() === member.user._id.toString());
                    const dayAvailability = memberSchedule?.availability.find(a => a.day === parseInt(day));
                    
                    return {
                        userId: member.user._id,
                        username: member.user.username || member.user.email,
                        fullName: member.user.fullName,
                        slots: dayAvailability?.slots || [],
                        note: dayAvailability?.note
                    };
                });

            dayData.availabilityPercentage = Math.round(
                (dayData.availableMembers.length / memberCount) * 100
            );

            // Ya no calculamos timeSlots comunes porque ahora los slots son eventos, no disponibilidad
            dayData.timeSlots = [];
        });

        // Convertir a array y ordenar por día
        const availabilityArray = Object.values(availabilityMap).sort((a, b) => a.day - b.day);

        // Calcular estadísticas generales
        const stats = {
            totalDays: daysInMonth,
            daysWithFullAvailability: availabilityArray.filter(d => d.availabilityPercentage === 100).length,
            daysWithPartialAvailability: availabilityArray.filter(d => d.availabilityPercentage > 0 && d.availabilityPercentage < 100).length,
            daysWithNoAvailability: availabilityArray.filter(d => d.availabilityPercentage === 0).length,
            averageAvailability: Math.round(
                availabilityArray.reduce((sum, d) => sum + d.availabilityPercentage, 0) / daysInMonth
            ),
            memberCount: memberCount,
            schedulesSubmitted: schedules.length
        };

        res.status(200).json({
            success: true,
            data: {
                groupId,
                groupName: group.name,
                month: parseInt(month),
                year: parseInt(year),
                availability: availabilityArray,
                stats
            }
        });
    } catch (error) {
        console.error('Error al obtener disponibilidad grupal:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener disponibilidad grupal'
        });
    }
};

/**
 * Calcular franjas horarias comunes entre múltiples horarios
 * Encuentra la intersección de slots de tiempo
 */
function calculateCommonTimeSlots(allSlots) {
    if (!allSlots || allSlots.length === 0) return [];
    if (allSlots.length === 1) return allSlots[0];

    // Convertir todos los slots a minutos desde medianoche para facilitar comparación
    const slotsInMinutes = allSlots.map(slots =>
        slots.map(slot => ({
            start: timeToMinutes(slot.start),
            end: timeToMinutes(slot.end),
            original: slot
        }))
    );

    // Encontrar intersecciones
    let commonSlots = slotsInMinutes[0];

    for (let i = 1; i < slotsInMinutes.length; i++) {
        const newCommon = [];

        for (const slot1 of commonSlots) {
            for (const slot2 of slotsInMinutes[i]) {
                // Calcular intersección
                const overlapStart = Math.max(slot1.start, slot2.start);
                const overlapEnd = Math.min(slot1.end, slot2.end);

                // Si hay intersección válida (al menos 30 minutos)
                if (overlapEnd - overlapStart >= 30) {
                    newCommon.push({
                        start: overlapStart,
                        end: overlapEnd
                    });
                }
            }
        }

        commonSlots = newCommon;
        if (commonSlots.length === 0) break;
    }

    // Convertir de vuelta a formato HH:MM
    return commonSlots.map(slot => ({
        start: minutesToTime(slot.start),
        end: minutesToTime(slot.end)
    }));
}

/**
 * Convertir tiempo HH:MM a minutos desde medianoche
 */
function timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * Convertir minutos desde medianoche a formato HH:MM
 */
function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}
