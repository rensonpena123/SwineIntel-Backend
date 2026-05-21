import express from 'express';
import { getFeedInventory, restockFeed, withdrawFeed } from '../controllers/feedController.js';
import { protect, ownerOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getFeedInventory);

router.post('/restock', protect, ownerOnly, restockFeed);
router.put('/withdraw', protect, withdrawFeed);

export default router;