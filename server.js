import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import penRoutes from './routes/penRoutes.js';

// env
dotenv.config();
// database
connectDB();

const app = express();

// Middleware
app.use(cors()); // Allows your React frontend to talk to this backend
app.use(express.json()); // Allows the server to understand JSON data sent in requests

app.use('/api/users', userRoutes); //users
app.use('/api/pens', penRoutes);  //Pens

app.get('/', (req, res) => {
  res.send('SwineIntel API is running... 🚀');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});