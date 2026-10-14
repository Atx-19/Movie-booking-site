// ================================================================
// Movie Ticket Booking System — Backend Server Entry Point
// Stack: Node.js + Express + mysql2 (Raw SQL, No ORM)
// ================================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const errorHandler = require('./middleware/errorHandler');

// Route imports
const movieRoutes   = require('./routes/movies');
const theatreRoutes = require('./routes/theatres');
const showRoutes    = require('./routes/shows');
const bookingRoutes = require('./routes/bookings');
const reportRoutes  = require('./routes/reports');
const reviewRoutes  = require('./routes/reviews');
const userRoutes    = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files if client exists
app.use(express.static(path.join(__dirname, '../client')));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Movie Ticket Booking API is healthy and operational!',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/movies',   movieRoutes);
app.use('/api/theatres', theatreRoutes);
app.use('/api/shows',    showRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reports',  reportRoutes);
app.use('/api/reviews',  reviewRoutes);
app.use('/api/users',    userRoutes);

// Centralized error handling middleware
app.use(errorHandler);

// Start listening
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Server running on: http://localhost:${PORT}`);
    console.log(`📡 API Health Check: http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
});
