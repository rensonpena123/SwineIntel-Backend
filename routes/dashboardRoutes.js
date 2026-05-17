import express from 'express';
import { getDashboardSummary } from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Fetch metrics (Requires user log in)
router.route('/').get(protect, getDashboardSummary);

export default router;