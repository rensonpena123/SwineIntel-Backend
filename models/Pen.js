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
    }
  },
  { timestamps: true }
);

// Auto-set capacity based on pen type
penSchema.pre('save', async function () {
  if (!this.capacity) {
    if (this.type === 'Kural') {
      this.capacity = 15;
    } else {
      // Paanakan and Bartolina both handle 1 inahin
      this.capacity = 1;
    }
  }
});
const Pen = mongoose.model('Pen', penSchema);
export default Pen;