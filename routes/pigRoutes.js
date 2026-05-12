import express from 'express';
import { addPig, farrowEvent, getPigs, promotePiglets } from '../controllers/pigController.js';
import { protect, ownerOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// All pig routes are protected (require login)
router.route('/')
  .post(protect, addPig)  // Add a single Sow or Fattener
  .get(protect, getPigs); // Get pigs with filters (?type=Sow)

router.post('/farrow', protect, farrowEvent);    // Record a birth
router.put('/promote', protect, promotePiglets); // Promote biiks & move Sow

export default router;