import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

/**
 * Genera un JWT para un usuario
 * @param {string} userId - ID del usuario
 * @returns {string} JWT token
 */
export const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
    );
};

/**
 * Verifica y decodifica un JWT
 * @param {string} token - JWT token
 * @returns {object} Payload decodificado
 * @throws {Error} Si el token es inválido
 */
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, config.jwtSecret);
    } catch (error) {
        throw new Error('Token inválido o expirado');
    }
};
