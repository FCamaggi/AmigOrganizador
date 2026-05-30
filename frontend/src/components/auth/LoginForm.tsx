import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Button from '../common/Button';
import Card from '../common/Card';
import Input from '../common/Input';

interface LoginFormData {
  emailOrUsername: string;
  password: string;
}

interface FormErrors {
  emailOrUsername?: string;
  password?: string;
  [key: string]: string | undefined;
}

const inputIcons = {
  user: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  lock: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect width="18" height="11" x="3" y="11" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  arrow: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  ),
};

const LoginForm = () => {
  const navigate = useNavigate();
  const { login, loading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState<LoginFormData>({
    emailOrUsername: '',
    password: '',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
    clearError();
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.emailOrUsername.trim()) {
      errors.emailOrUsername = 'Email o username es requerido';
    }

    if (!formData.password) {
      errors.password = 'La contrasena es requerida';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!validateForm()) return;

    try {
      const result = await login(formData);
      if (result?.user) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error en login:', error);
    }
  };

  return (
    <Card variant="glass" padding="xl" className="border-white/50 bg-white/80 shadow-cosmic">
      <h2 className="mb-8 text-center text-2xl font-extrabold text-neutral-900 sm:text-3xl">
        Iniciar sesion
      </h2>

      {error && (
        <div className="mb-5 rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm font-medium text-danger-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 p-4 text-sm text-primary-800">
          <span className="h-4 w-4 rounded-full border-2 border-primary-300 border-t-primary-700 animate-spin" />
          <span>Conectando con la API. Si Render estaba dormido, puede tardar unos segundos.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email o usuario"
          type="text"
          name="emailOrUsername"
          value={formData.emailOrUsername}
          onChange={handleChange}
          error={formErrors.emailOrUsername}
          placeholder="tu@email.com"
          icon={inputIcons.user}
          variant="glass"
          required
        />

        <Input
          label="Contrasena"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          error={formErrors.password}
          placeholder="********"
          icon={inputIcons.lock}
          variant="glass"
          required
        />

        <Button type="submit" variant="primary" loading={loading} fullWidth icon={inputIcons.arrow} iconPosition="right">
          Iniciar sesion
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-neutral-700">
        No tienes una cuenta?{' '}
        <Link to="/register" className="font-bold text-primary-700 transition-colors hover:text-accent-700">
          Registrate
        </Link>
      </div>
    </Card>
  );
};

export default LoginForm;
