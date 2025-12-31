import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    mongodbUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
};

// Validar variables de entorno críticas
if (!config.mongodbUri) {
    throw new Error('MONGODB_URI no está definida en las variables de entorno');
}

if (!config.jwtSecret) {
    throw new Error('JWT_SECRET no está definida en las variables de entorno');
}

if (config.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres');
}
