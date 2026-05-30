import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    mongodbUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    microsoftClientId: process.env.MICROSOFT_CLIENT_ID,
    microsoftClientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    tokenEncryptionKey: process.env.TOKEN_ENCRYPTION_KEY,
    eventScraperApiUrl: process.env.EVENT_SCRAPER_API_URL,
    eventScraperApiKey: process.env.EVENT_SCRAPER_API_KEY,
    eventScraperTimeoutMs: Number(process.env.EVENT_SCRAPER_TIMEOUT_MS) || 25000,
    eventScraperBatchSize: Number(process.env.EVENT_SCRAPER_BATCH_SIZE) || 10
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

const optionalCalendarVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'MICROSOFT_CLIENT_ID',
    'MICROSOFT_CLIENT_SECRET',
    'TOKEN_ENCRYPTION_KEY'
];

for (const envName of optionalCalendarVars) {
    if (!process.env[envName]) {
        console.warn(`Aviso: ${envName} no esta definida; la integracion de calendarios puede no estar disponible`);
    }
}

if (config.tokenEncryptionKey && Buffer.from(config.tokenEncryptionKey, 'hex').length !== 32) {
    console.warn('Aviso: TOKEN_ENCRYPTION_KEY debe ser una clave hex de 32 bytes para usar calendarios');
}
