import Schedule from '../models/Schedule.js';
import Group from '../models/Group.js';

/**
 * Obtener disponibilidad grupal para un mes específico
 * Calcula la disponibilidad común entre todos los miembros del grupo
 * Soporta 3 modos de análisis:
 * - daily: Día completo (sin eventos = disponible)
 * - hourly: Análisis hora a hora con intersecciones
 * - custom: Requiere mínimo X horas seguidas
 */
export const getGroupAvailability = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { month, year, mode = 'daily', minHours = 6 } = req.query;

        // Validar parámetros
        if (!month || !year) {
            return res.status(400).json({
                success: false,
                message: 'Mes y año son requeridos'
            });
        }

        const analysisMode = mode || 'daily';
        const minimumHours = parseInt(minHours) || 6;

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

        // Crear schedules vacíos para miembros que no tienen uno
        for (const memberId of memberIds) {
            await Schedule.getOrCreate(memberId, parseInt(year), parseInt(month));
        }

        const schedules = await Schedule.find({
            user: { $in: memberIds },
            month: parseInt(month),
            year: parseInt(year)
        }).populate('user', 'username email fullName');

        const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
        const memberCount = group.members.length;

        let availabilityArray;

        // Seleccionar método de análisis según modo
        switch (analysisMode) {
            case 'hourly':
                availabilityArray = calculateHourlyAvailability(schedules, daysInMonth, memberCount, group.members);
                break;
            case 'custom':
                availabilityArray = calculateCustomAvailability(schedules, daysInMonth, memberCount, group.members, minimumHours);
                break;
            case 'daily':
            default:
                availabilityArray = calculateDailyAvailability(schedules, daysInMonth, memberCount, group.members);
                break;
        }

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
            schedulesSubmitted: schedules.length,
            analysisMode: analysisMode,
            ...(analysisMode === 'custom' && { minimumHours })
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

/**
 * MODO 1: ANÁLISIS DÍA A DÍA
 * Marca disponible si NO hay eventos (slots) ese día
 * Lógica: Sin eventos = completamente libre = disponible
 */
function calculateDailyAvailability(schedules, daysInMonth, memberCount, groupMembers) {
    const availabilityMap = {};

    // Inicializar todos los días
    for (let day = 1; day <= daysInMonth; day++) {
        availabilityMap[day] = {
            day,
            availableMembers: [],
            unavailableMembers: [],
            availabilityPercentage: 0,
            timeSlots: []
        };
    }

    // Procesar cada schedule
    schedules.forEach(schedule => {
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

            if (!hasEvents) {
                availabilityMap[day].availableMembers.push(memberInfo);
            }
        }
    });

    // Calcular porcentajes y miembros no disponibles
    Object.keys(availabilityMap).forEach(day => {
        const dayData = availabilityMap[day];
        const availableIds = dayData.availableMembers.map(m => m.userId.toString());

        dayData.unavailableMembers = groupMembers
            .filter(member => !availableIds.includes(member.user._id.toString()))
            .map(member => {
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
    });

    return Object.values(availabilityMap).sort((a, b) => a.day - b.day);
}

/**
 * MODO 2: ANÁLISIS HORA A HORA
 * Calcula disponibilidad basada en intersecciones horarias
 * Fórmula: % = (horas libres en común / 24 horas) * 100
 * Ponderado por cantidad de miembros disponibles en cada hora
 */
function calculateHourlyAvailability(schedules, daysInMonth, memberCount, groupMembers) {
    const availabilityMap = {};

    for (let day = 1; day <= daysInMonth; day++) {
        // Crear mapa de horas (0-23) para cada miembro
        const hourlyMap = new Array(24).fill(0).map(() => ({ availableMembers: [], busyMembers: [] }));

        schedules.forEach(schedule => {
            const dayAvailability = schedule.availability.find(a => a.day === day);
            const memberInfo = {
                userId: schedule.user._id,
                username: schedule.user.username || schedule.user.email,
                fullName: schedule.user.fullName
            };

            if (!dayAvailability || !dayAvailability.slots || dayAvailability.slots.length === 0) {
                // Sin eventos = disponible todas las horas
                for (let hour = 0; hour < 24; hour++) {
                    hourlyMap[hour].availableMembers.push(memberInfo);
                }
            } else {
                // Marcar horas ocupadas por eventos
                const busyHours = new Set();
                dayAvailability.slots.forEach(slot => {
                    const startMinutes = timeToMinutes(slot.start);
                    const endMinutes = timeToMinutes(slot.end);
                    
                    // Manejar turnos que cruzan medianoche
                    if (endMinutes <= startMinutes && slot.start === slot.end) {
                        // Turno 24h
                        for (let hour = 0; hour < 24; hour++) {
                            busyHours.add(hour);
                        }
                    } else if (endMinutes < startMinutes) {
                        // Cruza medianoche
                        for (let m = startMinutes; m < 24 * 60; m += 60) {
                            busyHours.add(Math.floor(m / 60));
                        }
                        for (let m = 0; m < endMinutes; m += 60) {
                            busyHours.add(Math.floor(m / 60));
                        }
                    } else {
                        // Mismo día
                        for (let m = startMinutes; m < endMinutes; m += 60) {
                            busyHours.add(Math.floor(m / 60));
                        }
                    }
                });

                // Marcar disponibilidad por hora
                for (let hour = 0; hour < 24; hour++) {
                    if (busyHours.has(hour)) {
                        hourlyMap[hour].busyMembers.push({ ...memberInfo, slots: dayAvailability.slots });
                    } else {
                        hourlyMap[hour].availableMembers.push(memberInfo);
                    }
                }
            }
        });

        // Calcular porcentaje basado en horas con disponibilidad común
        // Fórmula: Promedio de (miembros disponibles / total miembros) por hora
        const hourlyPercentages = hourlyMap.map(hour => 
            (hour.availableMembers.length / memberCount) * 100
        );
        const avgPercentage = hourlyPercentages.reduce((sum, p) => sum + p, 0) / 24;

        // Encontrar bloques de tiempo comunes (al menos 2 horas seguidas con >50% disponibilidad)
        const commonTimeSlots = [];
        let blockStart = null;
        
        for (let hour = 0; hour < 24; hour++) {
            const percentage = hourlyPercentages[hour];
            
            if (percentage >= 50) {
                if (blockStart === null) {
                    blockStart = hour;
                }
            } else {
                if (blockStart !== null && hour - blockStart >= 2) {
                    commonTimeSlots.push({
                        start: minutesToTime(blockStart * 60),
                        end: minutesToTime(hour * 60),
                        availableCount: Math.round(memberCount * (hourlyPercentages[blockStart] / 100))
                    });
                }
                blockStart = null;
            }
        }
        
        // Cerrar último bloque si existe
        if (blockStart !== null && 24 - blockStart >= 2) {
            commonTimeSlots.push({
                start: minutesToTime(blockStart * 60),
                end: '23:59',
                availableCount: Math.round(memberCount * (hourlyPercentages[blockStart] / 100))
            });
        }

        // Obtener miembros disponibles/no disponibles basado en promedio del día
        const memberAvailability = schedules.map(schedule => {
            const dayAvailability = schedule.availability.find(a => a.day === day);
            const hasEvents = dayAvailability && dayAvailability.slots && dayAvailability.slots.length > 0;
            
            return {
                member: {
                    userId: schedule.user._id,
                    username: schedule.user.username || schedule.user.email,
                    fullName: schedule.user.fullName,
                    slots: dayAvailability?.slots || [],
                    note: dayAvailability?.note
                },
                available: !hasEvents,
                hoursFree: hourlyMap.filter(h => 
                    h.availableMembers.some(m => m.userId.toString() === schedule.user._id.toString())
                ).length
            };
        });

        availabilityMap[day] = {
            day,
            availableMembers: memberAvailability.filter(m => m.available).map(m => m.member),
            unavailableMembers: memberAvailability.filter(m => !m.available).map(m => m.member),
            availabilityPercentage: Math.round(avgPercentage),
            timeSlots: commonTimeSlots,
            hourlyData: hourlyMap // Info adicional para detalle
        };
    }

    return Object.values(availabilityMap).sort((a, b) => a.day - b.day);
}

/**
 * MODO 3: ANÁLISIS PERSONALIZADO (HORAS MÍNIMAS SEGUIDAS)
 * Solo marca disponibilidad si el grupo puede juntarse X horas seguidas
 * Lógica: Encuentra intersecciones de bloques libres >= minHours
 * % se ajusta si algunos miembros pueden menos horas
 */
function calculateCustomAvailability(schedules, daysInMonth, memberCount, groupMembers, minHours) {
    const availabilityMap = {};

    for (let day = 1; day <= daysInMonth; day++) {
        // Calcular bloques libres para cada miembro (en minutos)
        const memberFreeBlocks = schedules.map(schedule => {
            const dayAvailability = schedule.availability.find(a => a.day === day);
            const memberInfo = {
                userId: schedule.user._id,
                username: schedule.user.username || schedule.user.email,
                fullName: schedule.user.fullName,
                slots: dayAvailability?.slots || [],
                note: dayAvailability?.note
            };

            if (!dayAvailability || !dayAvailability.slots || dayAvailability.slots.length === 0) {
                // Todo el día libre
                return {
                    member: memberInfo,
                    freeBlocks: [{ start: 0, end: 24 * 60, hours: 24 }] // 00:00 a 24:00
                };
            }

            // Calcular bloques libres entre eventos
            const busyBlocks = dayAvailability.slots
                .map(slot => {
                    const startMinutes = timeToMinutes(slot.start);
                    const endMinutes = timeToMinutes(slot.end);
                    
                    // Manejar cruces de medianoche
                    if (startMinutes === endMinutes) {
                        return [{ start: 0, end: 24 * 60 }]; // Turno 24h = todo ocupado
                    } else if (endMinutes < startMinutes) {
                        // Cruza medianoche: ocupado desde start hasta 24:00 y desde 00:00 hasta end
                        return [
                            { start: startMinutes, end: 24 * 60 },
                            { start: 0, end: endMinutes }
                        ];
                    } else {
                        return [{ start: startMinutes, end: endMinutes }];
                    }
                })
                .flat()
                .sort((a, b) => a.start - b.start);

            // Fusionar bloques ocupados superpuestos
            const mergedBusy = [];
            busyBlocks.forEach(block => {
                if (mergedBusy.length === 0 || mergedBusy[mergedBusy.length - 1].end < block.start) {
                    mergedBusy.push(block);
                } else {
                    mergedBusy[mergedBusy.length - 1].end = Math.max(mergedBusy[mergedBusy.length - 1].end, block.end);
                }
            });

            // Calcular bloques libres
            const freeBlocks = [];
            let currentStart = 0;
            
            mergedBusy.forEach(busy => {
                if (currentStart < busy.start) {
                    const duration = (busy.start - currentStart) / 60;
                    freeBlocks.push({
                        start: currentStart,
                        end: busy.start,
                        hours: duration
                    });
                }
                currentStart = busy.end;
            });
            
            // Agregar último bloque si existe
            if (currentStart < 24 * 60) {
                const duration = (24 * 60 - currentStart) / 60;
                freeBlocks.push({
                    start: currentStart,
                    end: 24 * 60,
                    hours: duration
                });
            }

            return {
                member: memberInfo,
                freeBlocks
            };
        });

        // Encontrar intersecciones de bloques libres de al menos minHours
        const commonBlocks = findCommonFreeBlocks(memberFreeBlocks, minHours);

        // Calcular % basado en:
        // - 100% si todos pueden reunirse minHours
        // - Reducción proporcional si algunos pueden menos
        let availableCount = 0;
        let partialAvailableCount = 0;

        memberFreeBlocks.forEach(memberData => {
            const maxFreeBlock = Math.max(0, ...memberData.freeBlocks.map(b => b.hours));
            
            if (maxFreeBlock >= minHours) {
                availableCount++;
            } else if (maxFreeBlock >= minHours * 0.5) {
                // Cuenta parcialmente si tiene al menos 50% del tiempo mínimo
                partialAvailableCount++;
            }
        });

        // Fórmula: 100% peso completo + 50% peso parcial
        const percentage = Math.round(
            ((availableCount + (partialAvailableCount * 0.5)) / memberCount) * 100
        );

        availabilityMap[day] = {
            day,
            availableMembers: memberFreeBlocks
                .filter(m => Math.max(0, ...m.freeBlocks.map(b => b.hours)) >= minHours)
                .map(m => m.member),
            unavailableMembers: memberFreeBlocks
                .filter(m => Math.max(0, ...m.freeBlocks.map(b => b.hours)) < minHours)
                .map(m => m.member),
            availabilityPercentage: percentage,
            timeSlots: commonBlocks.map(block => ({
                start: minutesToTime(block.start),
                end: minutesToTime(block.end),
                hours: block.hours,
                memberCount: block.memberCount
            })),
            minHoursRequired: minHours
        };
    }

    return Object.values(availabilityMap).sort((a, b) => a.day - b.day);
}

/**
 * Encontrar bloques libres comunes entre todos los miembros
 * que cumplan con duración mínima
 */
function findCommonFreeBlocks(memberFreeBlocks, minHours) {
    if (memberFreeBlocks.length === 0) return [];

    // Obtener todos los bloques y crear lista de eventos (inicio/fin)
    const events = [];
    
    memberFreeBlocks.forEach((memberData, memberIndex) => {
        memberData.freeBlocks.forEach(block => {
            events.push({ time: block.start, type: 'start', memberIndex });
            events.push({ time: block.end, type: 'end', memberIndex });
        });
    });

    // Ordenar eventos por tiempo
    events.sort((a, b) => a.time - b.time);

    // Encontrar intersecciones
    const commonBlocks = [];
    const activeMembersSet = new Set();
    let blockStart = null;

    events.forEach(event => {
        const prevCount = activeMembersSet.size;
        
        if (event.type === 'start') {
            activeMembersSet.add(event.memberIndex);
        } else {
            activeMembersSet.delete(event.memberIndex);
        }
        
        const newCount = activeMembersSet.size;

        // Si todos están disponibles y acabamos de alcanzar ese estado
        if (newCount === memberFreeBlocks.length && prevCount < memberFreeBlocks.length) {
            blockStart = event.time;
        }
        
        // Si ya no todos están disponibles y teníamos un bloque
        if (newCount < memberFreeBlocks.length && prevCount === memberFreeBlocks.length && blockStart !== null) {
            const duration = (event.time - blockStart) / 60;
            if (duration >= minHours) {
                commonBlocks.push({
                    start: blockStart,
                    end: event.time,
                    hours: duration,
                    memberCount: memberFreeBlocks.length
                });
            }
            blockStart = null;
        }
    });

    return commonBlocks;
}
