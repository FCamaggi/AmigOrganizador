/**
 * Genera un código único alfanumérico
 * @param {number} length - Longitud del código (default 8)
 * @returns {string} Código generado
 */
export const generateUniqueCode = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};
