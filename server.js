import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import penRoutes from './routes/penRoutes.js';
import pigRoutes from './routes/pigRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import feedRoutes from './routes/feedRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

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
app.use('/api/pigs', pigRoutes); //Pigs

app.use('/api/dashboard', dashboardRoutes); // For the dashboard

app.use('/api/health', healthRoutes); // Health check

app.use('/api/feed', feedRoutes); // Feeds

app.use(notFound);  // Catches any URLs that don't match your routes
app.use(errorHandler);  // Catches any runtime errors thrown inside your controllers

app.get('/', (req, res) => {
  res.send('SwineIntel API is running... 🚀');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});