import mongoose from 'mongoose';

const pigSchema = new mongoose.Schema(
  {
    pigType: {
      type: String,
      enum: ['Sow', 'Piglet', 'Fattener'],
      required: true,
    },
    tagId: {
      type: String, 
      unique: true,
      sparse: true, // Allows multiple piglets to not have tags yet
    },
    motherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pig', // Links Piglets back to their Sow
    },
    penId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pen', // Links them to Bartolina, Paanakan, or Kural
      required: true,
    },
    breed: String,
    gender: {
      type: String,
      enum: ['Male', 'Female'],
    },
    weight: {
      type: Number, // in kg
      default: 0,
    },
    status: {
      type: String,
      enum: ['Healthy', 'Sick', 'Sold', 'Deceased'],
      default: 'Healthy',
    },
    isMarketed: {
      type: Boolean,
      default: false,
    },
    assignedCaretaker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Made optional so it can inherit from the Pen!
    }
  },
  { timestamps: true }
);

const Pig = mongoose.model('Pig', pigSchema);
export default Pig;