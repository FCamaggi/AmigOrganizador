import { useState, useCallback } from 'react';
import { useScheduleStore } from '../store/scheduleStore';
import type { DayAvailability } from '../services/scheduleService';
import Navbar from '../components/layout/Navbar';
import ScheduleCalendar from '../components/schedule/ScheduleCalendar';
import DayEditorModal from '../components/schedule/DayEditorModal';
import QuickScheduleView from '../components/schedule/QuickScheduleView';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';

type ViewMode = 'calendar' | 'quick';

const Schedule = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedAvailability, setSelectedAvailability] =
    useState<DayAvailability | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');

  const { exportSchedule, importSchedule, loading, currentSchedule } = useScheduleStore();

  const handleSelectDay = (date: Date, availability?: DayAvailability) => {
    setSelectedDate(date);
    setSelectedAvailability(availability || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedAvailability(null);
  }, []);

  const handleExport = async () => {
    try {
      await exportSchedule();
      alert('✅ Horario exportado con éxito');
    } catch (error) {
      console.error('Error exporting schedule:', error);
      alert('❌ Error al exportar el horario');
    }
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        try {
          await importSchedule(file);
          alert('✅ Horario importado con éxito');
        } catch (error) {
          console.error('Error importing schedule:', error);
          alert('❌ Error al importar el horario');
        }
      }
    };

    input.click();
  };

  // Calcular estadísticas
  const totalDaysWithSchedule = currentSchedule?.availability.filter(
    (day) => day.slots.length > 0
  ).length || 0;

  const totalSlots = currentSchedule?.availability.reduce(
    (sum, day) => sum + day.slots.length,
    0
  ) || 0;

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header Card */}
        <Card variant="gradient" padding="lg">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
                📅 Mi Horario
              </h1>
              <p className="text-white/90 text-base sm:text-lg">
                Gestiona tu disponibilidad de forma fácil y rápida
              </p>
              
              {/* Stats */}
              <div className="mt-3 sm:mt-4 flex flex-wrap gap-2 sm:gap-3">
                <div className="bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-white/80 text-xs sm:text-sm">Días configurados:</span>
                    <Badge variant="success">{totalDaysWithSchedule}</Badge>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-white/80 text-xs sm:text-sm">Franjas horarias:</span>
                    <Badge variant="primary">{totalSlots}</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full lg:w-auto">
              <Button
                onClick={() => setIsQuickModalOpen(true)}
                variant="secondary"
                size="md"
                icon={
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
              >
                Config. Rápida
              </Button>
              <Button
                onClick={handleExport}
                variant="outline"
                size="md"
                disabled={loading}
                className="bg-white/10 hover:bg-white/20 text-white border-white/30"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                }
              >
                Exportar
              </Button>
              <Button
                onClick={handleImport}
                variant="outline"
                size="md"
                disabled={loading}
                className="bg-white/10 hover:bg-white/20 text-white border-white/30"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                }
              >
                Importar
              </Button>
            </div>
          </div>
        </Card>

        {/* View Toggle */}
        <Card padding="sm">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                viewMode === 'calendar'
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              📅 Vista Calendario
            </button>
            <button
              onClick={() => setViewMode('quick')}
              className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                viewMode === 'quick'
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              ⚡ Config. Rápida
            </button>
          </div>
        </Card>

        {/* Content */}
        {viewMode === 'calendar' ? (
          <>
            <ScheduleCalendar onSelectDay={handleSelectDay} />

            {/* Guide Card */}
            <Card variant="elevated" padding="lg">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                    💡 Guía Rápida
                  </h3>
                  <p className="text-sm text-neutral-600">
                    Aprende a usar el calendario de horarios en 4 simples pasos
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex gap-3 p-4 bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl border border-primary-100">
                  <div className="w-8 h-8 rounded-lg bg-primary-500 text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900 mb-1">Haz clic en un día</p>
                    <p className="text-sm text-neutral-600">
                      Selecciona cualquier día del calendario para editarlo
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 p-4 bg-gradient-to-br from-accent-50 to-primary-50 rounded-xl border border-accent-100">
                  <div className="w-8 h-8 rounded-lg bg-accent-500 text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900 mb-1">Agrega horarios</p>
                    <p className="text-sm text-neutral-600">
                      Usa presets rápidos o define horarios manualmente
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 p-4 bg-gradient-to-br from-success-50 to-primary-50 rounded-xl border border-success-100">
                  <div className="w-8 h-8 rounded-lg bg-success-500 text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900 mb-1">Elimina si es necesario</p>
                    <p className="text-sm text-neutral-600">
                      Usa el botón "Eliminar Todo" para limpiar un día
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 p-4 bg-gradient-to-br from-warning-50 to-accent-50 rounded-xl border border-warning-100">
                  <div className="w-8 h-8 rounded-lg bg-warning-500 text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">
                    4
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900 mb-1">Guarda automáticamente</p>
                    <p className="text-sm text-neutral-600">
                      Tus cambios se sincronizan en tiempo real
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </>
        ) : (
          <Card padding="lg">
            <QuickScheduleView onApply={() => setViewMode('calendar')} />
          </Card>
        )}
      </div>

      {/* Day Editor Modal */}
      <DayEditorModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        selectedDate={selectedDate}
        existingAvailability={selectedAvailability ?? undefined}
      />

      {/* Quick Schedule Modal */}
      <Modal
        isOpen={isQuickModalOpen}
        onClose={() => setIsQuickModalOpen(false)}
        title="⚡ Configuración Rápida de Horario"
        description="Configura tu horario semanal en segundos con plantillas predefinidas"
        size="lg"
        headerGradient
      >
        <QuickScheduleView
          onApply={() => {
            setIsQuickModalOpen(false);
            setViewMode('calendar');
          }}
        />
      </Modal>
    </div>
  );
};

export default Schedule;
