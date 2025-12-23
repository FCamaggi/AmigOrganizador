import mongoose from 'mongoose';

/**
 * Esquema para slots de tiempo
 */
const timeSlotSchema = new mongoose.Schema({
    start: {
        type: String,
        required: true,
        match: /^([01]\d|2[0-3]):([0-5]\d)$/ // Formato HH:MM
    },
    end: {
        type: String,
        required: true,
        match: /^([01]\d|2[0-3]):([0-5]\d)$/ // Formato HH:MM
    }
}, { _id: false });

/**
 * Esquema para plantillas personalizadas de usuario
 */
const userTemplateSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    category: {
        type: String,
        enum: ['work', 'study', 'vacation', 'personal', 'custom'],
        required: true,
        default: 'custom'
    },
    color: {
        type: String,
        required: true,
        default: '#6b7280',
        match: /^#[0-9A-F]{6}$/i
    },
    defaultSlots: [timeSlotSchema],
    isDefault: {
        type: Boolean,
        default: false
    },
    order: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Índice compuesto para búsquedas rápidas por usuario
userTemplateSchema.index({ user: 1, order: 1 });
userTemplateSchema.index({ user: 1, isDefault: 1 });

/**
 * Método estático para crear plantillas por defecto para un usuario
 */
userTemplateSchema.statics.createDefaultTemplates = async function (userId) {
    const defaultTemplates = [
        {
            user: userId,
            name: 'Trabajo - Jornada Día',
            category: 'work',
            color: '#3b82f6',
            defaultSlots: [{ start: '08:00', end: '17:00' }],
            isDefault: true,
            order: 1
        },
        {
            user: userId,
            name: 'Trabajo - Jornada Noche',
            category: 'work',
            color: '#1e40af',
            defaultSlots: [{ start: '20:00', end: '05:00' }],
            isDefault: true,
            order: 2
        },
        {
            user: userId,
            name: 'Trabajo - 24 Horas',
            category: 'work',
            color: '#0f172a',
            defaultSlots: [{ start: '00:00', end: '23:59' }],
            isDefault: true,
            order: 3
        },
        {
            user: userId,
            name: 'Estudios',
            category: 'study',
            color: '#8b5cf6',
            defaultSlots: [{ start: '08:00', end: '14:00' }],
            isDefault: true,
            order: 4
        },
        {
            user: userId,
            name: 'Vacaciones',
            category: 'vacation',
            color: '#10b981',
            defaultSlots: [{ start: '00:00', end: '23:59' }],
            isDefault: true,
            order: 5
        },
        {
            user: userId,
            name: 'Evento Personal',
            category: 'personal',
            color: '#f59e0b',
            defaultSlots: [],
            isDefault: true,
            order: 6
        },
        {
            user: userId,
            name: 'Personalizado',
            category: 'custom',
            color: '#6b7280',
            defaultSlots: [],
            isDefault: true,
            order: 7
        }
    ];

    return await this.insertMany(defaultTemplates);
};

const UserTemplate = mongoose.model('UserTemplate', userTemplateSchema);
export default UserTemplate;
