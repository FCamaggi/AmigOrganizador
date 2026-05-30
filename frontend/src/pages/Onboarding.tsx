import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const steps = [
  {
    title: 'Sync Your Squad',
    description:
      'Importa calendarios o marca rapido tu disponibilidad. Nosotros ordenamos el caos del grupo.',
    accent: 'from-primary-100 to-accent-100',
    cta: 'Siguiente',
  },
  {
    title: 'Find the Window',
    description:
      'El ranking encuentra bloques utiles, no solo horas libres imposibles de usar.',
    accent: 'from-success-100 to-primary-100',
    cta: 'Siguiente',
  },
  {
    title: 'Pick the Plan',
    description:
      'Explora panoramas y eventos que calzan con los dias reales donde el grupo puede juntarse.',
    accent: 'from-warning-100 to-accent-100',
    cta: 'Entrar',
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  const finish = () => navigate('/dashboard', { replace: true });

  return (
    <main className="amig-cosmic-canvas flex min-h-screen items-center justify-center px-5 py-8">
      <div className="w-full max-w-md">
        <Card variant="glass" padding="xl" className="min-h-[580px] text-center shadow-cosmic sm:min-h-[640px]">
          <div className="flex h-full flex-col items-center justify-center">
            <div
              className={`mb-10 flex h-44 w-44 items-center justify-center rounded-full bg-gradient-to-br ${step.accent} shadow-cosmic`}
            >
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white/80 shadow-luxury">
                <svg
                  className="h-16 w-16 text-primary-700"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
            </div>

            <h1 className="text-4xl font-extrabold text-neutral-950">
              {step.title}
            </h1>
            <p className="mt-5 max-w-sm text-lg leading-8 text-neutral-700">
              {step.description}
            </p>
          </div>
        </Card>

        <div className="mt-8 flex items-center justify-center gap-2">
          {steps.map((item, index) => (
            <button
              key={item.title}
              type="button"
              onClick={() => setStepIndex(index)}
              className={`h-3 rounded-full transition-all ${
                index === stepIndex ? 'w-14 bg-primary-600' : 'w-3 bg-neutral-200'
              }`}
              aria-label={`Ir al paso ${index + 1}`}
            />
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Button variant="ghost" onClick={finish}>
            Saltar
          </Button>
          <Button
            size="lg"
            onClick={() => (isLastStep ? finish() : setStepIndex(stepIndex + 1))}
            icon={
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            }
            iconPosition="right"
          >
            {step.cta}
          </Button>
        </div>
      </div>
    </main>
  );
};

export default Onboarding;
