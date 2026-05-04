import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';

// 1. Load environment variables from your .env file
dotenv.config();

// 2. Connect to your MongoDB Atlas database
connectDB();

const app = express();

// 3. Middleware
app.use(cors()); // Allows your React frontend to talk to this backend
app.use(express.json()); // Allows the server to understand JSON data sent in requests

// 4. A simple "Home" route to test if the server is alive
app.get('/', (req, res) => {
  res.send('SwineIntel API is running... 🚀');
});

// 5. Set the port (5000 is standard for development)
const PORT = process.env.PORT || 5000;

// 6. Start the server and keep it running
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});