import { useEffect, useState, useMemo } from 'react';
import { format, getDaysInMonth, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { availabilityService } from '../../services/availabilityService';
import type {
  GroupAvailability,
  DayAvailability,
  AnalysisMode,
} from '../../services/availabilityService';
import Button from '../common/Button';
import Card from '../common/Card';

interface GroupAvailabilityViewProps {
  groupId: string;
  groupName: string;
}

const GroupAvailabilityView = ({
  groupId,
  groupName,
}: GroupAvailabilityViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availability, setAvailability] = useState<GroupAvailability | null>(
    null
  );
  const [selectedDay, setSelectedDay] = useState<DayAvailability | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('daily');
  const [minHours, setMinHours] = useState(6);
  const [showModeInfo, setShowModeInfo] = useState(false);

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const fetchAvailability = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await availabilityService.getGroupAvailability(
        groupId,
        month,
        year,
        analysisMode,
        minHours
      );
      setAvailability(data);
    } catch (err) {
      setError('Error al cargar la disponibilidad del grupo');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, month, year, analysisMode, minHours]);

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
    setSelectedDay(null);
  };

  const handleCurrentMonth = () => {
    setCurrentDate(new Date());
    setSelectedDay(null);
  };

  // Generar días del calendario con espacios vacíos
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = startOfMonth(currentDate);
    const firstDayWeekday = firstDayOfMonth.getDay(); // 0 = Domingo
    const daysInMonth = getDaysInMonth(currentDate);

    // Ajustar para que Lunes sea el primer día (0 = Lunes, 6 = Domingo)
    const adjustedFirstDay = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;

    const days = [];

    // Agregar días vacíos al inicio
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(null);
    }

    // Agregar días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const dayData = availability?.availability.find((d) => d.day === day);
      days.push({
        day,
        data: dayData,
      });
    }

    return days;
  }, [currentDate, availability]);

  const getColorClass = (percentage: number) => {
    if (percentage === 0) return 'bg-neutral-100 text-neutral-400';
    if (percentage < 50) return 'bg-red-100 text-red-700 hover:bg-red-200';
    if (percentage < 75)
      return 'bg-amber-100 text-amber-700 hover:bg-amber-200';
    if (percentage < 100)
      return 'bg-green-100 text-green-700 hover:bg-green-200';
    return 'bg-green-200 text-green-800 hover:bg-green-300';
  };

  if (isLoading && !availability) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header con navegación */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-neutral-800">
          Disponibilidad de {groupName}
        </h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handlePreviousMonth} className="flex-1 sm:flex-none text-xs sm:text-sm justify-center">
            ← Anterior
          </Button>
          <Button variant="secondary" onClick={handleCurrentMonth} className="flex-1 sm:flex-none text-xs sm:text-sm justify-center">
            Hoy
          </Button>
          <Button variant="secondary" onClick={handleNextMonth} className="flex-1 sm:flex-none text-xs sm:text-sm justify-center">
            Siguiente →
          </Button>
        </div>
      </div>

      {/* Selector de Modo de Análisis */}
      <Card padding="md">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-semibold text-neutral-800">
              🔍 Modo de Análisis
            </h3>
            <button
              onClick={() => setShowModeInfo(!showModeInfo)}
              className="text-primary-600 text-xs sm:text-sm font-medium hover:underline"
            >
              {showModeInfo ? 'Ocultar info' : 'Ver explicación'}
            </button>
          </div>

          {showModeInfo && (
            <div className="bg-primary-50 p-3 sm:p-4 rounded-lg text-xs sm:text-sm text-neutral-700 space-y-2">
              <p><strong>📅 Día a Día:</strong> Marca disponible si la persona no tiene eventos ese día.</p>
              <p><strong>⏰ Hora a Hora:</strong> Calcula % según horas libres en común. Muestra bloques de tiempo disponibles.</p>
              <p><strong>🎯 Personalizado:</strong> Solo marca disponibilidad si el grupo puede reunirse X horas seguidas mínimo.</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={() => {
                setAnalysisMode('daily');
                setSelectedDay(null);
              }}
              className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                analysisMode === 'daily'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
              }`}
            >
              <div className="text-xl sm:text-2xl mb-1">📅</div>
              <div className="text-xs sm:text-sm font-semibold">Día a Día</div>
              <div className="text-xs text-neutral-500 mt-1">Sin eventos = disponible</div>
            </button>

            <button
              onClick={() => {
                setAnalysisMode('hourly');
                setSelectedDay(null);
              }}
              className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                analysisMode === 'hourly'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
              }`}
            >
              <div className="text-xl sm:text-2xl mb-1">⏰</div>
              <div className="text-xs sm:text-sm font-semibold">Hora a Hora</div>
              <div className="text-xs text-neutral-500 mt-1">Intersección horaria</div>
            </button>

            <button
              onClick={() => {
                setAnalysisMode('custom');
                setSelectedDay(null);
              }}
              className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                analysisMode === 'custom'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
              }`}
            >
              <div className="text-xl sm:text-2xl mb-1">🎯</div>
              <div className="text-xs sm:text-sm font-semibold">Personalizado</div>
              <div className="text-xs text-neutral-500 mt-1">Horas mínimas</div>
            </button>
          </div>

          {analysisMode === 'custom' && (
            <div className="bg-amber-50 p-3 sm:p-4 rounded-lg">
              <label className="block text-xs sm:text-sm font-semibold text-neutral-800 mb-2">
                ⏱️ Horas seguidas mínimas para reunión:
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={minHours}
                  onChange={(e) => setMinHours(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xl sm:text-2xl font-bold text-primary-600 min-w-[3rem] text-center">
                  {minHours}h
                </span>
              </div>
              <p className="text-xs text-neutral-600 mt-2">
                Solo se marcarán días donde el grupo pueda reunirse al menos {minHours} horas seguidas.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Mes actual */}
      <div className="text-center">
        <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-neutral-700">
          {format(currentDate, 'MMMM yyyy', { locale: es })}
        </h3>
      </div>

      {error && (
        <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl text-sm sm:text-base text-red-700">
          {error}
        </div>
      )}

      {/* Estadísticas */}
      {availability && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
          <div className="bg-white p-3 sm:p-4 rounded-xl shadow-soft text-center">
            <div className="text-xl sm:text-2xl font-bold text-primary-600">
              {availability.stats.averageAvailability}%
            </div>
            <div className="text-xs sm:text-sm text-neutral-600">Promedio</div>
          </div>
          <div className="bg-green-50 p-3 sm:p-4 rounded-xl shadow-soft text-center">
            <div className="text-xl sm:text-2xl font-bold text-green-700">
              {availability.stats.daysWithFullAvailability}
            </div>
            <div className="text-xs sm:text-sm text-neutral-600">100% disponibles</div>
          </div>
          <div className="bg-amber-50 p-3 sm:p-4 rounded-xl shadow-soft text-center">
            <div className="text-xl sm:text-2xl font-bold text-amber-700">
              {availability.stats.daysWithPartialAvailability}
            </div>
            <div className="text-xs sm:text-sm text-neutral-600">Parcialmente</div>
          </div>
          <div className="bg-neutral-50 p-3 sm:p-4 rounded-xl shadow-soft text-center">
            <div className="text-xl sm:text-2xl font-bold text-neutral-600">
              {availability.stats.daysWithNoAvailability}
            </div>
            <div className="text-xs sm:text-sm text-neutral-600">Sin disponibilidad</div>
          </div>
          <div className="bg-primary-50 p-3 sm:p-4 rounded-xl shadow-soft text-center col-span-2 sm:col-span-1">
            <div className="text-xl sm:text-2xl font-bold text-primary-700">
              {availability.stats.schedulesSubmitted}/
              {availability.stats.memberCount}
            </div>
            <div className="text-xs sm:text-sm text-neutral-600">Horarios enviados</div>
          </div>
        </div>
      )}

      {/* Calendario */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-soft p-3 sm:p-4 lg:p-6">
        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
            <div
              key={day}
              className="text-center text-xs sm:text-sm font-semibold text-neutral-600 py-1 sm:py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Días del mes */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarDays.map((dayInfo, index) => {
            if (!dayInfo) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const { day, data } = dayInfo;
            const percentage = data?.availabilityPercentage ?? 0;
            const isSelected = selectedDay?.day === day;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(data || null)}
                className={`aspect-square rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all min-h-[44px] ${getColorClass(
                  percentage
                )} ${
                  isSelected ? 'ring-2 ring-primary-500 ring-offset-1 sm:ring-offset-2' : ''
                } ${percentage > 0 ? 'cursor-pointer' : 'cursor-default'}`}
                disabled={percentage === 0}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="text-sm sm:text-base lg:text-lg">{day}</div>
                  {percentage > 0 && (
                    <div className="text-xs font-bold">{percentage}%</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Leyenda */}
      <div className="bg-white rounded-xl shadow-soft p-3 sm:p-4">
        <h4 className="text-xs sm:text-sm font-semibold text-neutral-700 mb-2 sm:mb-3">
          Leyenda:
        </h4>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-neutral-100 rounded flex-shrink-0"></div>
            <span className="text-neutral-600">Sin datos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-red-100 rounded flex-shrink-0"></div>
            <span className="text-neutral-600">{'<50%'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-amber-100 rounded flex-shrink-0"></div>
            <span className="text-neutral-600">50-74%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 rounded flex-shrink-0"></div>
            <span className="text-neutral-600">75-99%</span>
          </div>
          <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-200 rounded flex-shrink-0"></div>
            <span className="text-neutral-600">100%</span>
          </div>
        </div>
      </div>

      {/* Detalle del día seleccionado */}
      {selectedDay && (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-soft p-4 sm:p-6">
          <h3 className="text-base sm:text-lg lg:text-xl font-bold text-neutral-800 mb-3 sm:mb-4">
            {format(new Date(year, month - 1, selectedDay.day), "d 'de' MMMM", {
              locale: es,
            })}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Miembros disponibles */}
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-green-700 mb-2 sm:mb-3">
                ✓ Disponibles ({selectedDay.availableMembers.length})
              </h4>
              <div className="space-y-2 sm:space-y-3">
                {selectedDay.availableMembers.length === 0 ? (
                  <p className="text-xs sm:text-sm text-neutral-500 italic">
                    No hay miembros disponibles este día
                  </p>
                ) : (
                  selectedDay.availableMembers.map((member) => (
                    <div
                      key={member.userId}
                      className="bg-green-50 p-2 sm:p-3 rounded-lg"
                    >
                      <p className="text-sm sm:text-base font-semibold text-neutral-800 truncate">
                        {member.fullName || member.username}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Sin eventos programados
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Miembros no disponibles */}
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-red-700 mb-2 sm:mb-3">
                ✗ No disponibles ({selectedDay.unavailableMembers.length})
              </h4>
              <div className="space-y-2">
                {selectedDay.unavailableMembers.length === 0 ? (
                  <p className="text-xs sm:text-sm text-neutral-500 italic">
                    Todos disponibles
                  </p>
                ) : (
                  selectedDay.unavailableMembers.map((member) => (
                    <div
                      key={member.userId}
                      className="bg-red-50 p-2 sm:p-3 rounded-lg"
                    >
                      <p className="text-sm sm:text-base font-semibold text-neutral-800 truncate">
                        {member.fullName || member.username}
                      </p>
                      {member.slots && member.slots.length > 0 && (
                        <div className="mt-1 sm:mt-2 space-y-1">
                          {member.slots.map((slot, idx) => (
                            <p key={idx} className="text-xs sm:text-sm text-neutral-600 truncate">
                              🔒 {slot.title || `${slot.start} - ${slot.end}`}
                            </p>
                          ))}
                        </div>
                      )}
                      {member.note && (
                        <p className="text-xs text-neutral-500 mt-1 sm:mt-2 italic line-clamp-2">
                          "{member.note}"
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Franjas horarias comunes */}
          {selectedDay.timeSlots && selectedDay.timeSlots.length > 0 && (
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-primary-50 rounded-xl">
              <h4 className="text-xs sm:text-sm font-semibold text-primary-900 mb-2 sm:mb-3">
                {analysisMode === 'daily' && '🎯 Horarios en común para todos los disponibles'}
                {analysisMode === 'hourly' && '⏰ Bloques de tiempo disponibles (≥2h, >50% del grupo)'}
                {analysisMode === 'custom' && `🎯 Bloques disponibles de ${minHours}+ horas seguidas`}
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedDay.timeSlots.map((slot, idx) => (
                  <div
                    key={idx}
                    className="px-3 sm:px-4 py-2 bg-primary-100 text-primary-700 rounded-lg"
                  >
                    <div className="text-xs sm:text-sm font-semibold">
                      {slot.start} - {slot.end}
                    </div>
                    {slot.hours !== undefined && (
                      <div className="text-xs text-primary-600 mt-0.5">
                        {slot.hours.toFixed(1)}h
                      </div>
                    )}
                    {slot.availableCount !== undefined && (
                      <div className="text-xs text-primary-600 mt-0.5">
                        {slot.availableCount} personas
                      </div>
                    )}
                    {slot.memberCount !== undefined && (
                      <div className="text-xs text-primary-600 mt-0.5">
                        Todos ({slot.memberCount})
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {analysisMode === 'hourly' && (
                <p className="text-xs text-neutral-600 mt-3">
                  💡 Estos son bloques de al menos 2 horas donde más del 50% del grupo está disponible.
                </p>
              )}
              {analysisMode === 'custom' && (
                <p className="text-xs text-neutral-600 mt-3">
                  💡 Estos bloques cumplen con el mínimo de {minHours} horas seguidas requerido.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GroupAvailabilityView;
