import { verifyToken } from '../utils/jwt.js';

/**
 * Middleware para proteger rutas con autenticación JWT
 */
export const auth = async (req, res, next) => {
    try {
        // Obtener token del header Authorization
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No autorizado. Token no proporcionado'
            });
        }

        const token = authHeader.substring(7); // Remover 'Bearer '

        // Verificar y decodificar token
        const decoded = verifyToken(token);

        // Agregar userId al request para uso en controladores
        req.userId = decoded.id;

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'No autorizado. Token inválido o expirado'
        });
    }
};
