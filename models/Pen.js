import mongoose from 'mongoose';

const penSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ['Kural', 'Paanakan', 'Bartolina'],
      required: true,
    },
    capacity: {
      type: Number,
    },
    currentHeadcount: {
      type: Number,
      default: 0,
    },
    assignedCaretaker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to your Caretaker (e.g., Ray Bakal)
    }
  },
  { timestamps: true }
);

// Auto-set capacity based on pen type
penSchema.pre('save', async function () {
  if (!this.capacity) {
    if (this.type === 'Kural') {
      this.capacity = 15;
    } else if (this.type === 'Paanakan') {
      this.capacity = 25; // Adjusted to hold 1 Sow + her piglets
    } else {
      this.capacity = 1; // Bartolina for 1 Sow
    }
  }
});
const Pen = mongoose.model('Pen', penSchema);
export default Pen;