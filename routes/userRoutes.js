import express from 'express';
import { getUsers, registerUser } from '../controllers/userController.js';
import { authUser } from '../controllers/userController.js';
import { protect, ownerOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// This links the '/register' URL 
router.get('/', protect, ownerOnly, getUsers);
router.post('/register', protect, ownerOnly , registerUser); // fro resgister user w/ authMiddleware
router.post('/login', authUser); // for authentication

export default router;