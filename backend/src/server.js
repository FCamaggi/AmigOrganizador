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

// Middleware de seguridad
app.use(helmet());

// CORS configurado para el frontend
app.use(cors({
    origin: function (origin, callback) {
        // Permitir requests sin origen (como mobile apps o curl)
        if (!origin) return callback(null, true);

        const allowedOrigins = [config.frontendUrl];

        // En desarrollo, permitir variantes de localhost
        if (config.nodeEnv === 'development') {
            allowedOrigins.push(
                'http://localhost:5173',
                'https://localhost:5173',
                'http://127.0.0.1:5173',
                'https://127.0.0.1:5173'
            );
        }

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true
}));

// Compresión de respuestas
app.use(compression());

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting general
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por ventana
    message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Rate limiting más estricto para autenticación
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // máximo 5 intentos de login
    message: 'Demasiados intentos de autenticación, intenta de nuevo más tarde',
    skipSuccessfulRequests: true,
});

// Ruta de prueba
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'AmigOrganizador API funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

// Registrar rutas
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/user-templates', userTemplateRoutes);

// Manejo de rutas no encontradas
app.use(notFound);

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

// Iniciar servidor
const PORT = config.port;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en modo ${config.nodeEnv}`);
    console.log(`📡 Puerto: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
});
