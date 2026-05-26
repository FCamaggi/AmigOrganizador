import crypto from 'crypto';
import { config } from '../config/env.js';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

const getKey = () => {
    if (!config.tokenEncryptionKey) {
        throw new Error('TOKEN_ENCRYPTION_KEY no esta configurada');
    }

    const key = Buffer.from(config.tokenEncryptionKey, 'hex');
    if (key.length !== 32) {
        throw new Error('TOKEN_ENCRYPTION_KEY debe ser una clave hex de 32 bytes');
    }

    return key;
};

export const encrypt = (text) => {
    if (!text) return null;

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
    const encrypted = Buffer.concat([
        cipher.update(text, 'utf8'),
        cipher.final()
    ]);

    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

export const decrypt = (encrypted) => {
    if (!encrypted) return null;

    const [ivHex, encryptedHex] = encrypted.split(':');
    if (!ivHex || !encryptedHex) {
        throw new Error('Token cifrado invalido');
    }

    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        getKey(),
        Buffer.from(ivHex, 'hex')
    );
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedHex, 'hex')),
        decipher.final()
    ]);

    return decrypted.toString('utf8');
};
