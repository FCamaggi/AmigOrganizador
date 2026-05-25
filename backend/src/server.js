import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/database.js';
import { config } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Importar rutas
import authRoutes from './routes/authRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import invitationRoutes from './routes/invitationRoutes.js';
import availabilityRoutes from './routes/availability.js';
import userRoutes from './routes/userRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import userTemplateRoutes from './routes/userTemplateRoutes.js';

const app = express();

// Conectar a la base de datos
connectDB();

// 🔐 Seguridad base
app.use(helmet());

// ✅ CORS
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const allowedOrigins = [config.frontendUrl];
    if (config.nodeEnv === 'development') {
      allowedOrigins.push(
        'http://localhost:5173',
        'https://localhost:5173',
        'http://127.0.0.1:5173',
        'https://127.0.0.1:5173'
      );
    }
    if (allowedOrigins.indexOf(origin) !== -1) callback(null, true);
    else callback(new Error('No permitido por CORS'));
  },
  credentials: true
}));

// 🗜️ Compresión
app.use(compression());

// 🧠 Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ⭐️⭐️⭐️ MUY IMPORTANTE: confiar en el proxy ANTES de los rate limiters
// En Render/Heroku suele ser 1 hop. Si tienes CDN + LB + Ingress, usa true.
app.set('trust proxy', 1); // o app.set('trust proxy', true);

// (Opcional) logs de diagnóstico temporales para validar IPs
// app.use((req, _res, next) => {
//   console.log('ip:', req.ip, 'xff:', req.headers['x-forwarded-for'], 'path:', req.path);
//   next();
// });

// 🌐 Rate limiting general (no tan estricto)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,       // 15 minutos
  max: 300,                       // más generoso para toda la API
  message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,  // ahora req.ip es confiable gracias a trust proxy
});
app.use(limiter);

// 🔒 Rate limiting más estricto para LOGIN (solo la ruta de login)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,                        // sube de 5 a 10 para evitar falsos positivos
  message: 'Demasiados intentos de autenticación, intenta de nuevo más tarde',
  skipSuccessfulRequests: true,   // si el login funciona, no cuenta
  // Clave más específica para evitar que una IP compartida queme el cupo
  keyGenerator: (req) => {
    // Solo si tu body tiene email/username en /login
    const email = (req.body?.email || '').toLowerCase();
    return `${req.ip}:${email}`;
  },
});

// 🩺 Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'AmigOrganizador API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// 🧭 Rutas
// 👉 Aplica el authLimiter SOLO a la ruta de login dentro de authRoutes.
// Si en tu authRoutes defines POST /login, puedes montarlo así:
app.use('/api/auth', (req, res, next) => {
  if (req.method === 'POST' && req.path === '/login') {
    return authLimiter(req, res, next);
  }
  next();
}, authRoutes);

app.use('/api/schedules', scheduleRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/user-templates', userTemplateRoutes);

// 🧭 404
app.use(notFound);

// 🧯 Errores
app.use(errorHandler);

// 🚀 Server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en modo ${config.nodeEnv}`);
  console.log(`📡 Puerto: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
});
