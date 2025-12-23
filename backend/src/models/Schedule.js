import mongoose from 'mongoose';

/**
 * Esquema para la disponibilidad de un día específico
 */
const dayAvailabilitySchema = new mongoose.Schema({
    day: {
        type: Number,
        required: true,
        min: 1,
        max: 31
    },
    slots: [{
        start: {
            type: String,
            required: true,
            match: /^([01]\d|2[0-3]):([0-5]\d)$/ // Formato HH:MM
        },
        end: {
            type: String,
            required: true,
            match: /^([01]\d|2[0-3]):([0-5]\d)$/ // Formato HH:MM
        },
        title: {
            type: String,
            trim: true,
            maxlength: 100
        },
        color: {
            type: String,
            trim: true,
            match: /^#[0-9A-Fa-f]{6}$/
        }
    }],
    note: {
        type: String,
        maxlength: 200
    }
}, { _id: false });

/**
 * Esquema para el horario mensual de un usuario
 */
const scheduleSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    month: {
        type: Number,
        required: true,
        min: 1,
        max: 12
    },
    year: {
        type: Number,
        required: true,
        min: 2020,
        max: 2100
    },
    availability: [dayAvailabilitySchema]
}, {
    timestamps: true
});

// Índice compuesto para optimizar búsquedas por usuario, mes y año
scheduleSchema.index({ user: 1, year: 1, month: 1 }, { unique: true });

/**
 * Método para obtener disponibilidad de un día específico
 */
scheduleSchema.methods.getDayAvailability = function (day) {
    return this.availability.find(a => a.day === day) || null;
};

/**
 * Método para actualizar disponibilidad de un día específico
 */
scheduleSchema.methods.updateDayAvailability = function (day, slots, note = '') {
    const existingDay = this.availability.find(a => a.day === day);

    if (existingDay) {
        existingDay.slots = slots;
        existingDay.note = note;
    } else {
        this.availability.push({ day, slots, note });
    }

    return this.save();
};

/**
 * Método para eliminar disponibilidad de un día específico
 */
scheduleSchema.methods.removeDayAvailability = function (day) {
    this.availability = this.availability.filter(a => a.day !== day);
    return this.save();
};

/**
 * Método estático para obtener o crear horario de un mes específico
 */
scheduleSchema.statics.getOrCreate = async function (userId, year, month) {
    let schedule = await this.findOne({ user: userId, year, month });

    if (!schedule) {
        schedule = await this.create({
            user: userId,
            year,
            month,
            availability: []
        });
    }

    return schedule;
};

const Schedule = mongoose.model('Schedule', scheduleSchema);
export default Schedule;
