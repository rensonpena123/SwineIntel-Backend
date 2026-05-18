import mongoose from 'mongoose';

const feedInventorySchema = new mongoose.Schema({
  feedType: {
    type: String,
    required: true,
    unique: true,
    enum: ['Booster', 'Pre-Starter', 'Starter', 'Grower', 'Breeder', 'Lactating']
  },
  currentSacks: {
    type: Number,
    required: true,
    default: 0
  },
  lowStockThreshold: {
    type: Number,
    required: true,
    default: 5 // Automatically alerts the owner if stock hits this number or below
  },
  needsReorder: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const FeedInventory = mongoose.model('FeedInventory', feedInventorySchema);
export default FeedInventory;