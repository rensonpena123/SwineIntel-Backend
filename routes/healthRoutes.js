import express from 'express';
import { logTreatment, getHealthHistory } from '../controllers/healthController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, logTreatment)
  .get(protect, getHealthHistory);

export default router;