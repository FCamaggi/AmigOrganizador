import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'El email es requerido'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Email inválido']
    },
    password: {
        type: String,
        required: [true, 'La contraseña es requerida'],
        minlength: [8, 'La contraseña debe tener al menos 8 caracteres']
    },
    username: {
        type: String,
        required: [true, 'El nombre de usuario es requerido'],
        unique: true,
        trim: true,
        minlength: [3, 'El username debe tener al menos 3 caracteres'],
        maxlength: [20, 'El username debe tener máximo 20 caracteres'],
        match: [/^[a-zA-Z0-9]+$/, 'El username solo puede contener letras y números']
    },
    fullName: {
        type: String,
        trim: true,
        maxlength: [100, 'El nombre completo debe tener máximo 100 caracteres']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    }
}, {
    timestamps: true
});

// Índices para mejorar performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

// Hook pre-save para hashear contraseña
userSchema.pre('save', async function (next) {
    // Solo hashear si la contraseña fue modificada
    if (!this.isModified('password')) return next();

    try {
        // Generar salt y hashear contraseña
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Método para obtener datos públicos del usuario (sin password)
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    delete user.__v;
    return user;
};

const User = mongoose.model('User', userSchema);

export default User;
