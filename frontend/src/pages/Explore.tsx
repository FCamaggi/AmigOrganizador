import { useEffect, useMemo, useState } from 'react';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import Skeleton from '../components/common/Skeleton';
import Navbar from '../components/layout/Navbar';
import { eventService, type Event } from '../services/eventService';

type Category = 'trending' | 'nightlife' | 'outdoors';

const curatedPlans = [
  {
    id: 'escape-room',
    title: 'The Quantum Paradox',
    category: 'Trending',
    description:
      'Un desafio de 60 minutos para grupos de 4 a 6, perfecto cuando quieren algo intenso y cerrado.',
    meta: ['$$', '2 hrs', 'Downtown'],
    rating: '4.9',
    palette: 'from-neutral-950 via-red-950 to-primary-900',
  },
  {
    id: 'mixology',
    title: 'Velvet Lounge & Spirits',
    category: 'Nightlife',
    description:
      'Cocteleria y conversaciones largas en una barra tranquila para grupos chicos.',
    meta: ['$$$', 'Noche', 'Reserva'],
    rating: '4.7',
    palette: 'from-amber-900 via-orange-700 to-neutral-950',
  },
  {
    id: 'picnic',
    title: 'Centennial Park Picnic',
    category: 'Outdoors',
    description:
      'Plan liviano para una tarde con comida, manta y cero logistica complicada.',
    meta: ['$', 'Tarde', 'Exterior'],
    rating: '4.5',
    palette: 'from-success-600 via-green-200 to-warning-200',
  },
];

const Explore = () => {
  const [activeCategory, setActiveCategory] = useState<Category>('trending');
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);
      setError('');
      try {
        const today = new Date();
        const result = await eventService.getEvents(
          format(today, 'yyyy-MM-dd'),
          format(addDays(today, 90), 'yyyy-MM-dd')
        );
        setEvents(result);
      } catch (err) {
        console.error(err);
        setError('No pudimos cargar tus eventos por ahora. Te dejamos ideas curadas mientras tanto.');
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, []);

  const personalPlans = useMemo(
    () =>
      events.slice(0, 4).map((event) => ({
        id: event._id,
        title: event.title,
        category: event.category,
        description: event.description || 'Plan guardado en tu calendario personal.',
        meta: [
          format(new Date(`${event.startDate}T12:00:00`), 'd MMM', {
            locale: es,
          }),
          event.allDay ? 'Todo el dia' : event.timeSlots[0]?.start || 'Sin hora',
          event.category,
        ],
        rating: 'Real',
        palette: 'from-primary-900 via-primary-600 to-accent-500',
      })),
    [events]
  );

  const plans = personalPlans.length > 0 ? personalPlans : curatedPlans;

  return (
    <>
      <Navbar />
      <main className="amig-cosmic-canvas min-h-screen pb-28 pt-6">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
          <header className="text-center">
            <p className="text-sm font-bold uppercase text-primary-700">
              Explore
            </p>
            <h1 className="mt-2 text-4xl font-extrabold text-neutral-950 sm:text-5xl">
              Curated Experiences
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-neutral-700">
              Descubre planes perfectos para la dinamica del grupo, desde noches
              de alta energia hasta tardes relajadas.
            </p>
          </header>

          <div className="flex flex-wrap justify-center gap-2">
            {[
              { id: 'trending' as const, label: 'Trending' },
              { id: 'nightlife' as const, label: 'Nightlife' },
              { id: 'outdoors' as const, label: 'Outdoors' },
            ].map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`min-h-11 rounded-full px-5 text-sm font-bold transition-all ${
                  activeCategory === category.id
                    ? 'bg-cosmic-action text-white shadow-cosmic'
                    : 'bg-white/70 text-neutral-700 hover:bg-white'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="rounded-2xl border border-warning-200 bg-warning-50 p-4 text-sm font-medium text-warning-800">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="grid gap-5 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} padding="none" className="overflow-hidden">
                  <Skeleton className="h-52 w-full" rounded="lg" />
                  <div className="p-5">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="mt-3 h-4 w-full" />
                    <Skeleton className="mt-2 h-4 w-4/5" />
                  </div>
                </Card>
              ))}
            </div>
          ) : plans.length === 0 ? (
            <EmptyState
              title="No hay planes para mostrar"
              description="Cuando tengas eventos o sugerencias disponibles, apareceran aqui."
            />
          ) : (
            <section className="grid gap-5 lg:grid-cols-3" aria-label="Planes sugeridos">
              {plans.map((plan, index) => (
                <Card key={plan.id} variant="elevated" padding="none" className="overflow-hidden">
                  <div className={`relative h-56 bg-gradient-to-br ${plan.palette}`}>
                    <div className="absolute right-3 top-3 rounded-xl bg-white/85 px-3 py-1 text-sm font-bold text-neutral-900 shadow-soft">
                      {plan.rating}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-bold uppercase text-primary-700">
                      {plan.category}
                    </p>
                    <h2 className="mt-2 text-2xl font-extrabold text-neutral-950">
                      {plan.title}
                    </h2>
                    <p className="mt-3 line-clamp-3 min-h-[72px] text-sm leading-6 text-neutral-700">
                      {plan.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {plan.meta.map((item) => (
                        <span
                          key={item}
                          className="rounded-lg bg-surface-low px-2 py-1 text-xs font-semibold text-neutral-700"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                    <div className="mt-5 border-t border-neutral-200 pt-4">
                      <Button fullWidth variant={index === 0 ? 'primary' : 'secondary'}>
                        {personalPlans.length > 0 ? 'Ver detalle' : index === 0 ? 'Book Now' : 'Propose to Group'}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </section>
          )}
        </div>
      </main>
    </>
  );
};

export default Explore;
