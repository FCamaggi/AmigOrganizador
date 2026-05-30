import { useCallback, useMemo, useState } from 'react';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { useToast } from '../components/common/toastContext';
import CalendarImportModal from '../components/schedule/CalendarImportModal';
import DayEditorModal from '../components/schedule/DayEditorModal';
import QuickScheduleView from '../components/schedule/QuickScheduleView';
import ScheduleCalendar from '../components/schedule/ScheduleCalendar';
import Navbar from '../components/layout/Navbar';
import type { DayAvailability } from '../services/scheduleService';
import { useScheduleStore } from '../store/scheduleStore';

type ViewMode = 'calendar' | 'quick';

const iconClassName = 'h-5 w-5';

const icons = {
  calendar: (
    <svg className={iconClassName} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v4M16 2v4M3 10h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 6h14v15H5z" />
    </svg>
  ),
  importCalendar: (
    <svg className={iconClassName} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v4M16 2v4M3 10h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 6h14v15H5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v5M9.5 16.5 12 19l2.5-2.5" />
    </svg>
  ),
  sparkles: (
    <svg className={iconClassName} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M19 17v4M17 19h4" />
    </svg>
  ),
  export: (
    <svg className={iconClassName} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m8 12 4 4 4-4M12 16V4" />
    </svg>
  ),
  upload: (
    <svg className={iconClassName} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m16 8-4-4-4 4M12 4v12" />
    </svg>
  ),
};

const Schedule = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
  const [isCalendarImportOpen, setIsCalendarImportOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedAvailability, setSelectedAvailability] =
    useState<DayAvailability | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const { showToast } = useToast();

  const { exportSchedule, importSchedule, loading, currentSchedule } =
    useScheduleStore();

  const monthLabel = useMemo(() => {
    if (!currentSchedule) return 'Calendario';
    const date = new Date(currentSchedule.year, currentSchedule.month - 1, 1);
    return date.toLocaleDateString('es-CL', {
      month: 'long',
      year: 'numeric',
    });
  }, [currentSchedule]);

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
      showToast({
        title: 'Horario exportado',
        description: 'El archivo JSON quedo listo para guardar.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error exporting schedule:', error);
      showToast({
        title: 'No se pudo exportar',
        description: 'Intenta nuevamente en unos segundos.',
        variant: 'error',
      });
    }
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.onchange = async (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      try {
        await importSchedule(file);
        showToast({
          title: 'Horario importado',
          description: 'Tus datos se sincronizaron correctamente.',
          variant: 'success',
        });
      } catch (error) {
        console.error('Error importing schedule:', error);
        showToast({
          title: 'No se pudo importar',
          description: 'Revisa que el archivo sea un JSON valido.',
          variant: 'error',
        });
      }
    };

    input.click();
  };

  const totalDaysWithSchedule =
    currentSchedule?.availability.filter((day) => day.slots.length > 0)
      .length || 0;

  const totalSlots =
    currentSchedule?.availability.reduce(
      (sum, day) => sum + day.slots.length,
      0
    ) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-surface to-accent-50 pb-28 md:pb-8">
      <Navbar />

      <main className="mx-auto max-w-content space-y-6 px-4 py-6 md:px-8">
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-primary-700">
              Tu disponibilidad
            </p>
            <h1 className="mt-2 text-5xl font-extrabold capitalize text-neutral-950 md:text-6xl">
              {monthLabel}
            </h1>
            <p className="mt-4 max-w-2xl text-lg font-medium text-neutral-700">
              Toca un dia para marcar horarios ocupados, turnos o bloques de disponibilidad.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <Button
              onClick={() => setIsCalendarImportOpen(true)}
              variant="secondary"
              disabled={loading}
              icon={icons.importCalendar}
            >
              Importar calendario
            </Button>
            <Button
              onClick={() => setIsQuickModalOpen(true)}
              variant="primary"
              icon={icons.sparkles}
            >
              Auto-fill
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card variant="glass" padding="lg" className="bg-white/75">
            <p className="text-sm font-bold text-neutral-600">Dias configurados</p>
            <p className="mt-2 text-4xl font-extrabold text-primary-700">{totalDaysWithSchedule}</p>
          </Card>
          <Card variant="glass" padding="lg" className="bg-white/75">
            <p className="text-sm font-bold text-neutral-600">Franjas horarias</p>
            <p className="mt-2 text-4xl font-extrabold text-accent-700">{totalSlots}</p>
          </Card>
          <Card variant="glass" padding="lg" className="bg-white/75">
            <p className="text-sm font-bold text-neutral-600">Modo actual</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant={viewMode === 'calendar' ? 'primary' : 'glass'}>Calendario</Badge>
              <Badge variant={viewMode === 'quick' ? 'primary' : 'glass'}>Configuracion rapida</Badge>
            </div>
          </Card>
        </section>

        <Card variant="glass" padding="sm" className="bg-white/75">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setViewMode('calendar')}
              className={`min-h-12 rounded-xl px-4 text-sm font-bold transition-all ${
                viewMode === 'calendar'
                  ? 'bg-cosmic-action text-white shadow-soft'
                  : 'text-neutral-700 hover:bg-white'
              }`}
            >
              Vista calendario
            </button>
            <button
              onClick={() => setViewMode('quick')}
              className={`min-h-12 rounded-xl px-4 text-sm font-bold transition-all ${
                viewMode === 'quick'
                  ? 'bg-cosmic-action text-white shadow-soft'
                  : 'text-neutral-700 hover:bg-white'
              }`}
            >
              Configuracion rapida
            </button>
          </div>
        </Card>

        {viewMode === 'calendar' ? (
          <div className="space-y-6">
            <ScheduleCalendar onSelectDay={handleSelectDay} />

            <Card variant="elevated" padding="lg">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                {[
                  ['1', 'Toca un dia', 'Abre el editor diario desde el calendario.'],
                  ['2', 'Agrega horarios', 'Usa presets o crea franjas manuales.'],
                  ['3', 'Turnos noche', 'Los bloques 20:00-08:00 continuan al dia siguiente.'],
                  ['4', 'Sincroniza', 'Importa Google Calendar o usa plantillas rapidas.'],
                ].map(([step, title, description]) => (
                  <div key={step} className="rounded-xl border border-surface-high bg-surface-low p-4">
                    <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-cosmic-action text-sm font-bold text-white">
                      {step}
                    </div>
                    <p className="font-bold text-neutral-900">{title}</p>
                    <p className="mt-1 text-sm text-neutral-600">{description}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : (
          <Card variant="glass" padding="lg" className="bg-white/80">
            <QuickScheduleView onApply={() => setViewMode('calendar')} />
          </Card>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            onClick={handleImport}
            variant="secondary"
            disabled={loading}
            icon={icons.upload}
          >
            Importar JSON
          </Button>
          <Button
            onClick={handleExport}
            variant="outline"
            disabled={loading}
            icon={icons.export}
          >
            Exportar JSON
          </Button>
        </div>
      </main>

      <DayEditorModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        selectedDate={selectedDate}
        existingAvailability={selectedAvailability ?? undefined}
      />

      <Modal
        isOpen={isQuickModalOpen}
        onClose={() => setIsQuickModalOpen(false)}
        title="Configuracion rapida"
        description="Aplica plantillas predefinidas o personalizadas sin perder control sobre tus dias."
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

      <CalendarImportModal
        isOpen={isCalendarImportOpen}
        onClose={() => setIsCalendarImportOpen(false)}
      />
    </div>
  );
};

export default Schedule;
