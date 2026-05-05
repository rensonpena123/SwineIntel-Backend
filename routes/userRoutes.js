import express from 'express';
import { registerUser } from '../controllers/userController.js';

const router = express.Router();

// This links the '/register' URL 
router.post('/register', registerUser);

export default router;