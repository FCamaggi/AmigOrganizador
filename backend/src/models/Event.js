import mongoose from 'mongoose';

/**
 * Plantillas predefinidas para eventos
 */
export const EVENT_TEMPLATES = {
    WORK_DAY: {
        name: 'Trabajo - Jornada Día',
        category: 'work',
        defaultSlots: [{ start: '08:00', end: '17:00' }],
        color: '#3b82f6'
    },
    WORK_NIGHT: {
        name: 'Trabajo - Jornada Noche',
        category: 'work',
        defaultSlots: [{ start: '20:00', end: '05:00' }],
        color: '#1e40af'
    },
    WORK_24H: {
        name: 'Trabajo - 24 Horas',
        category: 'work',
        defaultSlots: [{ start: '00:00', end: '23:59' }],
        color: '#0f172a'
    },
    STUDY: {
        name: 'Estudios',
        category: 'study',
        defaultSlots: [{ start: '08:00', end: '14:00' }],
        color: '#8b5cf6'
    },
    VACATION: {
        name: 'Vacaciones',
        category: 'vacation',
        defaultSlots: [{ start: '00:00', end: '23:59' }],
        color: '#10b981'
    },
    PERSONAL_EVENT: {
        name: 'Evento Personal',
        category: 'personal',
        defaultSlots: [],
        color: '#f59e0b'
    },
    CUSTOM: {
        name: 'Personalizado',
        category: 'custom',
        defaultSlots: [],
        color: '#6b7280'
    }
};

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
 * Esquema para configuración de recurrencia
 */
const recurrenceSchema = new mongoose.Schema({
    enabled: {
        type: Boolean,
        default: false
    },
    frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        default: 'weekly'
    },
    // Para weekly: [0-6] donde 0 = Domingo, 1 = Lunes, etc.
    daysOfWeek: [{
        type: Number,
        min: 0,
        max: 6
    }],
    // Para monthly: días del mes [1-31]
    daysOfMonth: [{
        type: Number,
        min: 1,
        max: 31
    }],
    // Fecha de fin de recurrencia (opcional)
    endDate: {
        type: Date
    }
}, { _id: false });

/**
 * Esquema para eventos del calendario
 */
const eventSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    category: {
        type: String,
        enum: ['work', 'study', 'vacation', 'personal', 'custom'],
        required: true,
        default: 'custom'
    },
    userTemplate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserTemplate'
    },
    color: {
        type: String,
        default: '#6b7280',
        match: /^#[0-9A-F]{6}$/i
    },
    // Fecha de inicio del evento
    startDate: {
        type: Date,
        required: true,
        index: true
    },
    // Fecha de fin del evento (para eventos de múltiples días)
    endDate: {
        type: Date,
        required: true,
        index: true
    },
    // Slots de tiempo específicos para este evento
    timeSlots: [timeSlotSchema],
    // Si es evento de todo el día
    allDay: {
        type: Boolean,
        default: false
    },
    // Configuración de recurrencia
    recurrence: recurrenceSchema
}, {
    timestamps: true
});

// Índices compuestos para optimizar consultas
eventSchema.index({ user: 1, startDate: 1, endDate: 1 });
eventSchema.index({ user: 1, category: 1 });

/**
 * Método para verificar si el evento está activo en una fecha específica
 */
eventSchema.methods.isActiveOnDate = function (date) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const start = new Date(this.startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(this.endDate);
    end.setHours(0, 0, 0, 0);

    // Verificar si está en el rango básico
    if (targetDate < start || targetDate > end) {
        return false;
    }

    // Si no hay recurrencia, está activo si está en el rango
    if (!this.recurrence || !this.recurrence.enabled) {
        return true;
    }

    // Verificar recurrencia
    if (this.recurrence.endDate && targetDate > new Date(this.recurrence.endDate)) {
        return false;
    }

    switch (this.recurrence.frequency) {
        case 'daily':
            return true;

        case 'weekly':
            if (!this.recurrence.daysOfWeek || this.recurrence.daysOfWeek.length === 0) {
                return true;
            }
            return this.recurrence.daysOfWeek.includes(targetDate.getDay());

        case 'monthly':
            if (!this.recurrence.daysOfMonth || this.recurrence.daysOfMonth.length === 0) {
                return true;
            }
            return this.recurrence.daysOfMonth.includes(targetDate.getDate());

        default:
            return true;
    }
};

/**
 * Método para obtener todos los slots de tiempo para una fecha específica
 */
eventSchema.methods.getTimeSlotsForDate = function (date) {
    if (!this.isActiveOnDate(date)) {
        return [];
    }

    if (this.allDay) {
        return [{ start: '00:00', end: '23:59' }];
    }

    return this.timeSlots;
};

/**
 * Método para clonar el evento (útil para crear recurrencias)
 */
eventSchema.methods.clone = function () {
    const cloned = this.toObject();
    delete cloned._id;
    delete cloned.createdAt;
    delete cloned.updatedAt;
    return cloned;
};

/**
 * Método estático para aplicar una plantilla
 */
eventSchema.statics.applyTemplate = function (templateKey) {
    const template = EVENT_TEMPLATES[templateKey];
    if (!template) {
        throw new Error('Plantilla no encontrada');
    }

    return {
        category: template.category,
        template: templateKey,
        color: template.color,
        timeSlots: template.defaultSlots,
        allDay: template.defaultSlots.some(slot => slot.start === '00:00' && slot.end === '23:59')
    };
};

const Event = mongoose.model('Event', eventSchema);
export default Event;
