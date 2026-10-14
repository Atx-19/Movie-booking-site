// ================================================================
// Routes: Reports (/api/reports)
// Serves Advanced SQL Queries from Phase 4
// ================================================================
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. Movie Revenue Leaderboard (View: v_movie_revenue)
router.get('/movie-revenue', async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT * FROM v_movie_revenue 
            ORDER BY total_revenue DESC
        `);
        res.json({ success: true, count: rows.length, data: rows });
    } catch (err) {
        next(err);
    }
});

// 2. Live Show Seat Availability (View: v_show_availability)
router.get('/show-availability', async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT * FROM v_show_availability 
            ORDER BY show_time ASC
        `);
        res.json({ success: true, count: rows.length, data: rows });
    } catch (err) {
        next(err);
    }
});

// 3. High-Volume Theatres (GROUP BY + HAVING)
router.get('/busiest-theatres', async (req, res, next) => {
    try {
        const minBookings = parseInt(req.query.minBookings || '2', 10);
        const [rows] = await db.query(`
            SELECT 
                t.theatre_id,
                t.name AS theatre_name,
                t.city,
                COUNT(DISTINCT b.booking_id) AS confirmed_bookings_count,
                COALESCE(SUM(bs.price), 0.00) AS total_theatre_revenue
            FROM theatres t
            JOIN screens sc       ON t.theatre_id = sc.theatre_id
            JOIN shows s          ON sc.screen_id = s.screen_id
            JOIN bookings b       ON s.show_id = b.show_id AND b.status = 'confirmed'
            JOIN booking_seats bs ON b.booking_id = bs.booking_id
            GROUP BY t.theatre_id, t.name, t.city
            HAVING confirmed_bookings_count >= ?
            ORDER BY confirmed_bookings_count DESC
        `, [minBookings]);
        res.json({ success: true, count: rows.length, data: rows });
    } catch (err) {
        next(err);
    }
});

// 4. Above-Average Rated Movies (Scalar Subquery)
router.get('/top-rated-movies', async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                m.movie_id,
                m.title,
                m.language,
                ROUND(AVG(r.rating), 2) AS movie_avg_rating,
                COUNT(r.review_id) AS review_count
            FROM movies m
            JOIN reviews r ON m.movie_id = r.movie_id
            GROUP BY m.movie_id, m.title, m.language
            HAVING AVG(r.rating) > (SELECT AVG(rating) FROM reviews)
            ORDER BY movie_avg_rating DESC
        `);
        res.json({ success: true, count: rows.length, data: rows });
    } catch (err) {
        next(err);
    }
});

// 5. Relational Division: Users who booked every genre
router.get('/genre-connoisseurs', async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                u.user_id,
                u.name,
                u.email,
                COUNT(DISTINCT mg.genre_id) AS distinct_genres_watched
            FROM users u
            JOIN bookings b       ON u.user_id = b.user_id AND b.status = 'confirmed'
            JOIN shows s          ON b.show_id = s.show_id
            JOIN movie_genres mg  ON s.movie_id = mg.movie_id
            GROUP BY u.user_id, u.name, u.email
            HAVING distinct_genres_watched = (SELECT COUNT(*) FROM genres)
        `);
        res.json({ success: true, count: rows.length, data: rows });
    } catch (err) {
        next(err);
    }
});

// 6. Audit Log: Inspection of cancellations
router.get('/audit-logs', async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                a.log_id,
                a.action,
                a.table_name,
                a.record_id,
                a.old_values,
                a.new_values,
                a.action_time,
                u.name AS performed_by_user
            FROM audit_log a
            LEFT JOIN users u ON a.performed_by = u.user_id
            ORDER BY a.action_time DESC
            LIMIT 50
        `);
        res.json({ success: true, count: rows.length, data: rows });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
