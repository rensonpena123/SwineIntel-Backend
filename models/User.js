import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
            trim: true,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            trim: true,
            minLength: 6,
        },
        role: {
            type: String,
            enum: ['Owner', 'Caretaker'], 
            default: 'Caretaker',         
        },
        isActive: {
            type: Boolean,
            default: true,
        }
    },
    {
        timestamps: true // auto tracks 'createdAt' and 'updatedAt'
    }
);

const User = mongoose.model('User', userSchema);
export default User;