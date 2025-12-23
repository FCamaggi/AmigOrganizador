import { useState, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { textColors } from '../../styles/design-system';
import Input from '../common/Input';
import Button from '../common/Button';
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
}

const RegisterForm = () => {
  const navigate = useNavigate();
  const { register, loading, error, clearError } = useAuthStore();

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

    // Validar email
    if (!formData.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!isValidEmail(formData.email)) {
      errors.email = 'Email inválido';
    }

    // Validar username
    if (!formData.username.trim()) {
      errors.username = 'El username es requerido';
    } else if (!isValidUsername(formData.username)) {
      errors.username = 'Username inválido (3-20 caracteres alfanuméricos)';
    }

    // Validar contraseña
    if (!formData.password) {
      errors.password = 'La contraseña es requerida';
    } else if (!isValidPassword(formData.password)) {
      errors.password = 'Mínimo 8 caracteres, una mayúscula y un número';
    }

    // Validar confirmación de contraseña
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!validateForm()) return;

    try {
      // No enviamos confirmPassword al backend
      const { confirmPassword, ...userData } = formData;
      const result = await register(userData);
      // Solo navegar si el registro fue exitoso
      if (result && result.user) {
        navigate('/dashboard');
      }
    } catch (error) {
      // El error ya está manejado en el store y se mostrará en la UI
      console.error('Error en registro:', error);
      // No hacer nada más - el error ya está en el estado
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="card">
        <h2 className={`text-3xl font-bold text-center mb-8 ${textColors.heading}`}>
          Crear Cuenta
        </h2>

        {error && (
          <div className="mb-6 p-4 bg-danger-50 border border-danger-200 text-danger-700 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            error={formErrors.email}
            placeholder="tu@email.com"
            required
          />

          <Input
            label="Username"
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            error={formErrors.username}
            placeholder="usuario123"
            required
          />

          <Input
            label="Nombre Completo"
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            error={formErrors.fullName}
            placeholder="Juan Pérez (opcional)"
          />

          <Input
            label="Contraseña"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            error={formErrors.password}
            placeholder="Mín. 8 caracteres"
            required
          />

          <Input
            label="Confirmar Contraseña"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={formErrors.confirmPassword}
            placeholder="Repite tu contraseña"
            required
          />

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full mt-6"
          >
            Registrarse
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-neutral-600">
          ¿Ya tienes cuenta?{' '}
          <Link
            to="/login"
            className="text-primary-600 hover:text-primary-700 font-semibold transition-colors"
          >
            Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
