import mongoose from 'mongoose';
import crypto from 'crypto';

/**
 * Esquema para invitaciones a grupos
 */
const invitationSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    invitedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    invitedEmail: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'expired'],
        default: 'pending'
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true
    },
    acceptedAt: {
        type: Date
    },
    message: {
        type: String,
        maxlength: 200
    }
}, {
    timestamps: true
});

// Índices para búsquedas rápidas
invitationSchema.index({ group: 1, status: 1 });
invitationSchema.index({ invitedEmail: 1, status: 1 });
invitationSchema.index({ invitedUser: 1, status: 1 });

/**
 * Método estático para generar código único de invitación
 */
invitationSchema.statics.generateUniqueCode = async function () {
    let code;
    let exists = true;

    while (exists) {
        // Generar código aleatorio de 8 caracteres
        code = crypto.randomBytes(4).toString('hex').toUpperCase();
        exists = await this.findOne({ code });
    }

    return code;
};

/**
 * Método para verificar si la invitación está expirada
 */
invitationSchema.methods.isExpired = function () {
    return this.expiresAt < new Date();
};

/**
 * Método para aceptar invitación
 */
invitationSchema.methods.accept = async function (userId) {
    if (this.isExpired()) {
        throw new Error('La invitación ha expirado');
    }

    if (this.status !== 'pending') {
        throw new Error('Esta invitación ya fue procesada');
    }

    this.status = 'accepted';
    this.acceptedAt = new Date();
    this.invitedUser = userId;

    return this.save();
};

/**
 * Método para rechazar invitación
 */
invitationSchema.methods.reject = async function () {
    if (this.status !== 'pending') {
        throw new Error('Esta invitación ya fue procesada');
    }

    this.status = 'rejected';
    return this.save();
};

/**
 * Middleware pre-save para generar código único
 */
invitationSchema.pre('save', async function (next) {
    if (this.isNew && !this.code) {
        this.code = await this.constructor.generateUniqueCode();
    }

    // Marcar como expirada si ya pasó la fecha
    if (this.isExpired() && this.status === 'pending') {
        this.status = 'expired';
    }

    next();
});

/**
 * Método toJSON para customizar respuesta
 */
invitationSchema.methods.toJSON = function () {
    const invitation = this.toObject();

    // Agregar información calculada
    invitation.isExpired = this.isExpired();

    return invitation;
};

const Invitation = mongoose.model('Invitation', invitationSchema);
export default Invitation;
