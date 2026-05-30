import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Button from '../common/Button';
import Card from '../common/Card';
import Input from '../common/Input';
import {
  isValidEmail,
  isValidPassword,
  isValidUsername,
} from '../../utils/validators';

interface RegisterFormData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}

interface FormErrors {
  email?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
  fullName?: string;
  [key: string]: string | undefined;
}

interface ApiFieldError {
  field: string;
  message: string;
}

interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string;
      errors?: ApiFieldError[];
    };
  };
}

const inputIcons = {
  user: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  at: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" />
    </svg>
  ),
  mail: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m22 7-10 6L2 7" />
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

const RegisterForm = () => {
  const navigate = useNavigate();
  const { register, loading, error, clearError } = useAuthStore();
  const registrationRequestIdRef = useRef(crypto.randomUUID());

  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
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
    registrationRequestIdRef.current = crypto.randomUUID();
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!isValidEmail(formData.email)) {
      errors.email = 'Email invalido';
    }

    if (!formData.username.trim()) {
      errors.username = 'El username es requerido';
    } else if (!isValidUsername(formData.username)) {
      errors.username = 'Username invalido (3-20 caracteres alfanumericos)';
    }

    if (!formData.password) {
      errors.password = 'La contrasena es requerida';
    } else if (!isValidPassword(formData.password)) {
      errors.password = 'Minimo 8 caracteres, una mayuscula y un numero';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirma tu contrasena';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Las contrasenas no coinciden';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!validateForm()) return;

    try {
      const userData = {
        email: formData.email,
        username: formData.username,
        password: formData.password,
        fullName: formData.fullName,
      };
      const result = await register({
        ...userData,
        registrationRequestId: registrationRequestIdRef.current,
      });
      if (result?.user) {
        registrationRequestIdRef.current = crypto.randomUUID();
        navigate('/onboarding');
      }
    } catch (error) {
      console.error('Error en registro:', error);
      const apiErrors = (error as ApiErrorResponse).response?.data?.errors;
      if (apiErrors?.length) {
        setFormErrors((currentErrors) => ({
          ...currentErrors,
          ...Object.fromEntries(
            apiErrors.map((apiError) => [apiError.field, apiError.message])
          ),
        }));
      }
    }
  };

  return (
    <Card variant="glass" padding="xl" className="border-white/70 bg-white/80 shadow-cosmic">
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre completo"
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          error={formErrors.fullName}
          placeholder="Alex Morgan"
          icon={inputIcons.user}
          variant="glass"
        />

        <Input
          label="Username"
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          error={formErrors.username}
          placeholder="alex_m"
          icon={inputIcons.at}
          variant="glass"
          required
        />

        <Input
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          error={formErrors.email}
          placeholder="alex@example.com"
          icon={inputIcons.mail}
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

        <Input
          label="Confirmar contrasena"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={formErrors.confirmPassword}
          placeholder="********"
          icon={inputIcons.lock}
          variant="glass"
          required
        />

        <Button type="submit" variant="primary" loading={loading} fullWidth icon={inputIcons.arrow} iconPosition="right">
          Crear cuenta
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-neutral-700">
        Ya tienes cuenta?{' '}
        <Link to="/login" className="font-bold text-primary-700 transition-colors hover:text-accent-700">
          Inicia sesion
        </Link>
      </div>
    </Card>
  );
};

export default RegisterForm;
