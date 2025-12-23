import mongoose from 'mongoose';
import crypto from 'crypto';

/**
 * Esquema para grupos de usuarios
 */
const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'El nombre del grupo es requerido'],
        trim: true,
        minlength: [3, 'El nombre debe tener al menos 3 caracteres'],
        maxlength: [50, 'El nombre no puede exceder 50 caracteres']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [200, 'La descripción no puede exceder 200 caracteres']
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        index: true
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        role: {
            type: String,
            enum: ['admin', 'member'],
            default: 'member'
        }
    }],
    settings: {
        isPrivate: {
            type: Boolean,
            default: false
        },
        allowMemberInvites: {
            type: Boolean,
            default: true
        },
        minimumAvailabilityHours: {
            type: Number,
            default: 2,
            min: 1,
            max: 24
        }
    }
}, {
    timestamps: true
});

// Índice para búsquedas rápidas
groupSchema.index({ creator: 1 });
groupSchema.index({ 'members.user': 1 });

/**
 * Método estático para generar código único de 6 caracteres
 */
groupSchema.statics.generateUniqueCode = async function () {
    let code;
    let exists = true;

    while (exists) {
        // Generar código aleatorio de 6 caracteres alfanuméricos
        code = crypto.randomBytes(3).toString('hex').toUpperCase();
        exists = await this.findOne({ code });
    }

    return code;
};

/**
 * Método para verificar si un usuario es miembro del grupo
 */
groupSchema.methods.isMember = function (userId) {
    return this.members.some(member =>
        member.user.toString() === userId.toString()
    );
};

/**
 * Método para verificar si un usuario es admin del grupo
 */
groupSchema.methods.isAdmin = function (userId) {
    return this.members.some(member =>
        member.user.toString() === userId.toString() && member.role === 'admin'
    );
};

/**
 * Método para agregar un miembro al grupo
 */
groupSchema.methods.addMember = function (userId, role = 'member') {
    if (!this.isMember(userId)) {
        this.members.push({
            user: userId,
            role,
            joinedAt: new Date()
        });
    }
    return this.save();
};

/**
 * Método para remover un miembro del grupo
 */
groupSchema.methods.removeMember = function (userId) {
    this.members = this.members.filter(member =>
        member.user.toString() !== userId.toString()
    );
    return this.save();
};

/**
 * Método para obtener número de miembros
 */
groupSchema.methods.getMemberCount = function () {
    return this.members.length;
};

/**
 * Middleware pre-save para generar código único si no existe
 */
groupSchema.pre('save', async function (next) {
    if (!this.code) {
        this.code = await this.constructor.generateUniqueCode();
    }
    next();
});

/**
 * Método toJSON para customizar la respuesta
 */
groupSchema.methods.toJSON = function () {
    const group = this.toObject();

    // Agregar información calculada
    group.memberCount = this.getMemberCount();

    return group;
};

const Group = mongoose.model('Group', groupSchema);
export default Group;
