import { APP_NAME } from '../../utils/constants';
import { cn } from '../../styles/design-system';

interface AuthShellProps {
  children: React.ReactNode;
  subtitle: string;
  tone?: 'deep' | 'soft';
}

const AuthShell = ({ children, subtitle, tone = 'soft' }: AuthShellProps) => (
  <main
    className={cn(
      'flex min-h-screen items-center justify-center px-4 py-8 sm:px-6',
      tone === 'deep'
        ? 'bg-cosmic-gradient'
        : 'bg-gradient-to-br from-primary-50 via-surface to-accent-50'
    )}
  >
    <section className="w-full max-w-md" aria-labelledby="auth-title">
      <div className="mb-8 text-center">
        <h1
          id="auth-title"
          className={cn(
            'text-4xl font-extrabold sm:text-5xl',
            tone === 'deep'
              ? 'text-white drop-shadow-sm'
              : 'bg-cosmic-action bg-clip-text text-transparent'
          )}
        >
          {APP_NAME}
        </h1>
        <p
          className={cn(
            'mt-4 text-lg font-medium leading-relaxed',
            tone === 'deep' ? 'text-white/90' : 'text-neutral-700'
          )}
        >
          {subtitle}
        </p>
      </div>

      {children}
    </section>
  </main>
);

export default AuthShell;
