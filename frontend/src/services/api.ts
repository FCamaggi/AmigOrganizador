import axios from 'axios';
import type { AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getApiErrorMessage = (
  error: unknown,
  fallback: string
): string => {
  const axiosError = error as AxiosError<{ message?: string }>;
  const status = axiosError.response?.status;

  if (status === 502 || status === 503 || status === 504) {
    return 'El servidor se está levantando. Espera unos segundos y vuelve a intentar.';
  }

  if (!axiosError.response) {
    return 'No pudimos conectar con la API. Si el servidor estaba dormido, espera unos segundos y vuelve a intentar.';
  }

  return axiosError.response.data?.message || fallback;
};

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Solo redirigir en 401 si NO estamos en las rutas de autenticación
    if (
      error.response?.status === 401 &&
      !window.location.pathname.includes('/login') &&
      !window.location.pathname.includes('/register')
    ) {
      // Token expirado o inválido - solo para rutas protegidas
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
