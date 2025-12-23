import { useEffect, useState, useMemo } from 'react';
import { format, getDaysInMonth, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { availabilityService } from '../../services/availabilityService';
import type {
  GroupAvailability,
  DayAvailability,
} from '../../services/availabilityService';
import Button from '../common/Button';

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

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const fetchAvailability = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await availabilityService.getGroupAvailability(
        groupId,
        month,
        year
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
  }, [groupId, month, year]);

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
    <div className="space-y-6">
      {/* Header con navegación */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-800">
          Disponibilidad de {groupName}
        </h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handlePreviousMonth}>
            ← Anterior
          </Button>
          <Button variant="secondary" onClick={handleCurrentMonth}>
            Hoy
          </Button>
          <Button variant="secondary" onClick={handleNextMonth}>
            Siguiente →
          </Button>
        </div>
      </div>

      {/* Mes actual */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-neutral-700">
          {format(currentDate, 'MMMM yyyy', { locale: es })}
        </h3>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      )}

      {/* Estadísticas */}
      {availability && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-soft text-center">
            <div className="text-2xl font-bold text-primary-600">
              {availability.stats.averageAvailability}%
            </div>
            <div className="text-sm text-neutral-600">Promedio</div>
          </div>
          <div className="bg-green-50 p-4 rounded-xl shadow-soft text-center">
            <div className="text-2xl font-bold text-green-700">
              {availability.stats.daysWithFullAvailability}
            </div>
            <div className="text-sm text-neutral-600">100% disponibles</div>
          </div>
          <div className="bg-amber-50 p-4 rounded-xl shadow-soft text-center">
            <div className="text-2xl font-bold text-amber-700">
              {availability.stats.daysWithPartialAvailability}
            </div>
            <div className="text-sm text-neutral-600">Parcialmente</div>
          </div>
          <div className="bg-neutral-50 p-4 rounded-xl shadow-soft text-center">
            <div className="text-2xl font-bold text-neutral-600">
              {availability.stats.daysWithNoAvailability}
            </div>
            <div className="text-sm text-neutral-600">Sin disponibilidad</div>
          </div>
          <div className="bg-primary-50 p-4 rounded-xl shadow-soft text-center">
            <div className="text-2xl font-bold text-primary-700">
              {availability.stats.schedulesSubmitted}/
              {availability.stats.memberCount}
            </div>
            <div className="text-sm text-neutral-600">Horarios enviados</div>
          </div>
        </div>
      )}

      {/* Calendario */}
      <div className="bg-white rounded-2xl shadow-soft p-6">
        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-semibold text-neutral-600 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Días del mes */}
        <div className="grid grid-cols-7 gap-2">
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
                className={`aspect-square rounded-xl font-semibold text-sm transition-all ${getColorClass(
                  percentage
                )} ${
                  isSelected ? 'ring-2 ring-primary-500 ring-offset-2' : ''
                } ${percentage > 0 ? 'cursor-pointer' : 'cursor-default'}`}
                disabled={percentage === 0}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="text-lg">{day}</div>
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
      <div className="bg-white rounded-xl shadow-soft p-4">
        <h4 className="text-sm font-semibold text-neutral-700 mb-3">
          Leyenda:
        </h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-neutral-100 rounded"></div>
            <span className="text-neutral-600">Sin datos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-100 rounded"></div>
            <span className="text-neutral-600">{'<50% disponible'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-amber-100 rounded"></div>
            <span className="text-neutral-600">50-74% disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-100 rounded"></div>
            <span className="text-neutral-600">75-99% disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-200 rounded"></div>
            <span className="text-neutral-600">100% disponible</span>
          </div>
        </div>
      </div>

      {/* Detalle del día seleccionado */}
      {selectedDay && (
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <h3 className="text-xl font-bold text-neutral-800 mb-4">
            {format(new Date(year, month - 1, selectedDay.day), "d 'de' MMMM", {
              locale: es,
            })}
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Miembros disponibles */}
            <div>
              <h4 className="text-sm font-semibold text-green-700 mb-3">
                ✓ Disponibles ({selectedDay.availableMembers.length})
              </h4>
              <div className="space-y-3">
                {selectedDay.availableMembers.length === 0 ? (
                  <p className="text-sm text-neutral-500 italic">No hay miembros disponibles este día</p>
                ) : (
                  selectedDay.availableMembers.map((member) => (
                    <div
                      key={member.userId}
                      className="bg-green-50 p-3 rounded-lg"
                    >
                      <p className="font-semibold text-neutral-800">
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
              <h4 className="text-sm font-semibold text-red-700 mb-3">
                ✗ No disponibles ({selectedDay.unavailableMembers.length})
              </h4>
              <div className="space-y-2">
                {selectedDay.unavailableMembers.length === 0 ? (
                  <p className="text-sm text-neutral-500 italic">Todos disponibles</p>
                ) : (
                  selectedDay.unavailableMembers.map((member) => (
                    <div
                      key={member.userId}
                      className="bg-red-50 p-3 rounded-lg"
                    >
                      <p className="font-semibold text-neutral-800">
                        {member.fullName || member.username}
                      </p>
                      {member.slots && member.slots.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {member.slots.map((slot, idx) => (
                            <p key={idx} className="text-sm text-neutral-600">
                              🔒 {slot.title || `${slot.start} - ${slot.end}`}
                            </p>
                          ))}
                        </div>
                      )}
                      {member.note && (
                        <p className="text-xs text-neutral-500 mt-2 italic">
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
          {selectedDay.timeSlots.length > 0 && (
            <div className="mt-6 p-4 bg-primary-50 rounded-xl">
              <h4 className="text-sm font-semibold text-primary-900 mb-3">
                🎯 Horarios en común para todos los disponibles:
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedDay.timeSlots.map((slot, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-primary-100 text-primary-700 font-semibold rounded-lg"
                  >
                    {slot.start} - {slot.end}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GroupAvailabilityView;
