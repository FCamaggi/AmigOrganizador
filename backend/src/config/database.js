import mongoose from 'mongoose';
import { config } from './env.js';

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(config.mongodbUri, {
            // Opciones recomendadas para MongoDB 6+
            serverSelectionTimeoutMS: 5000,
        });

        console.log(`✅ MongoDB conectado: ${conn.connection.host}`);

        // Event listeners para monitoreo
        mongoose.connection.on('error', (err) => {
            console.error('❌ Error de MongoDB:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB desconectado');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('🔄 MongoDB reconectado');
        });

    } catch (error) {
        console.error('❌ Error al conectar a MongoDB:', error.message);
        process.exit(1);
    }
};
