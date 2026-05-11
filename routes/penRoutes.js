import express from 'express';
import { createPen, getPens } from '../controllers/penController.js';
import { protect, ownerOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get pens is public for staff, but creating is Owner only
router.route('/')
  .post(protect, ownerOnly, createPen)
  .get(protect, getPens);

export default router;