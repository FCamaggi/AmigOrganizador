import { useState, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { textColors } from '../../styles/design-system';
import Input from '../common/Input';
import Button from '../common/Button';

interface LoginFormData {
  emailOrUsername: string;
  password: string;
}

interface FormErrors {
  emailOrUsername?: string;
  password?: string;
}

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
    // Limpiar error del campo cuando el usuario empieza a escribir
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
      errors.password = 'La contraseña es requerida';
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
      // Solo navegar si el login fue exitoso
      if (result && result.user) {
        navigate('/dashboard');
      }
    } catch (error) {
      // El error ya está manejado en el store y se mostrará en la UI
      console.error('Error en login:', error);
      // No hacer nada más - el error ya está en el estado
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="card">
        <h2 className={`text-3xl font-bold text-center mb-8 ${textColors.heading}`}>
          Iniciar Sesión
        </h2>

        {error && (
          <div className="mb-6 p-4 bg-danger-50 border border-danger-200 text-danger-700 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Input
            label="Email o Username"
            type="text"
            name="emailOrUsername"
            value={formData.emailOrUsername}
            onChange={handleChange}
            error={formErrors.emailOrUsername}
            placeholder="tu@email.com o usuario123"
            required
          />

          <Input
            label="Contraseña"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            error={formErrors.password}
            placeholder="••••••••"
            required
          />

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full mt-6"
          >
            Iniciar Sesión
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-neutral-600">
          ¿No tienes cuenta?{' '}
          <Link
            to="/register"
            className="text-primary-600 hover:text-primary-700 font-semibold transition-colors"
          >
            Regístrate aquí
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
