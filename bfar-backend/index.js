// bfar-backend/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import your newly separated route files
const dataRoutes = require('./routes/data');
const syncRoutes = require('./routes/sync');
const uploadRoutes = require('./routes/upload'); 

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Base Route
app.get('/', (req, res) => {
  res.send("<h1>✅ Backend is Running!</h1>");
});

// Tell Express to use your routes and prefix them with "/api"
app.use('/api', dataRoutes);
app.use('/api', syncRoutes);
app.use('/api', uploadRoutes);

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});