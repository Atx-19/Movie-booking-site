// ================================================================
// Routes: Shows (/api/shows)
// ================================================================
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/shows - List shows (filter by movie_id, theatre_id, city, date)
router.get('/', async (req, res, next) => {
    try {
        const { movie_id, theatre_id, city, date } = req.query;
        let sql = `
            SELECT 
                s.show_id,
                s.movie_id,
                m.title AS movie_title,
                m.language,
                m.duration_min,
                t.theatre_id,
                t.name AS theatre_name,
                t.city,
                sc.screen_id,
                sc.screen_name,
                s.show_time,
                s.end_time,
                GROUP_CONCAT(CONCAT(sp.category, ':', sp.price) ORDER BY sp.price ASC SEPARATOR ', ') AS pricing
            FROM shows s
            JOIN movies m        ON s.movie_id = m.movie_id
            JOIN screens sc      ON s.screen_id = sc.screen_id
            JOIN theatres t      ON sc.theatre_id = t.theatre_id
            JOIN show_pricing sp ON s.show_id = sp.show_id
        `;
        const conditions = [];
        const params = [];

        if (movie_id) {
            conditions.push('s.movie_id = ?');
            params.push(movie_id);
        }
        if (theatre_id) {
            conditions.push('t.theatre_id = ?');
            params.push(theatre_id);
        }
        if (city) {
            conditions.push('t.city = ?');
            params.push(city);
        }
        if (date) {
            conditions.push('DATE(s.show_time) = ?');
            params.push(date);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' GROUP BY s.show_id ORDER BY s.show_time ASC';

        const [shows] = await db.query(sql, params);
        res.json({ success: true, count: shows.length, data: shows });
    } catch (err) {
        next(err);
    }
});

// GET /api/shows/:id - Get specific show with details & pricing tiers
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const [shows] = await db.query(`
            SELECT 
                s.show_id,
                s.show_time,
                s.end_time,
                m.movie_id,
                m.title AS movie_title,
                m.duration_min,
                m.language,
                t.theatre_id,
                t.name AS theatre_name,
                t.city,
                sc.screen_id,
                sc.screen_name,
                sc.total_seats
            FROM shows s
            JOIN movies m   ON s.movie_id = m.movie_id
            JOIN screens sc ON s.screen_id = sc.screen_id
            JOIN theatres t ON sc.theatre_id = t.theatre_id
            WHERE s.show_id = ?
        `, [id]);

        if (shows.length === 0) {
            return res.status(404).json({ success: false, error: 'Show not found' });
        }

        const [pricing] = await db.query(`
            SELECT category, price
            FROM show_pricing
            WHERE show_id = ?
            ORDER BY price ASC
        `, [id]);

        res.json({
            success: true,
            data: {
                ...shows[0],
                pricing
            }
        });
    } catch (err) {
        next(err);
    }
});

// GET /api/shows/:id/seats - Get ALL screen seats and live booked status
// Used by the interactive seat-selection grid on the frontend
router.get('/:id/seats', async (req, res, next) => {
    try {
        const { id } = req.params;

        const [seats] = await db.query(`
            SELECT 
                s.seat_id,
                s.row_label,
                s.seat_number,
                s.category,
                sp.price,
                CASE WHEN bs.seat_id IS NOT NULL THEN 1 ELSE 0 END AS is_booked
            FROM seats s
            JOIN shows sh         ON s.screen_id = sh.screen_id
            JOIN show_pricing sp  ON sh.show_id = sp.show_id AND s.category = sp.category
            LEFT JOIN booking_seats bs ON sh.show_id = bs.show_id AND s.seat_id = bs.seat_id
            WHERE sh.show_id = ?
            ORDER BY s.row_label ASC, s.seat_number ASC
        `, [id]);

        if (seats.length === 0) {
            return res.status(404).json({ success: false, error: 'No seats found for this show' });
        }

        res.json({
            success: true,
            show_id: parseInt(id, 10),
            total_seats: seats.length,
            available_seats: seats.filter(s => !s.is_booked).length,
            data: seats
        });
    } catch (err) {
        next(err);
    }
});

// POST /api/shows - Schedule a new show (Admin)
// Demonstrates BEFORE INSERT trigger checking for show overlap
router.post('/', async (req, res, next) => {
    const connection = await db.getConnection();
    try {
        const { movie_id, screen_id, show_time, prices } = req.body;
        // prices: { regular: 200, premium: 350, vip: 500 }

        if (!movie_id || !screen_id || !show_time || !prices) {
            return res.status(400).json({ 
                success: false, 
                error: 'movie_id, screen_id, show_time, and prices {regular, premium, vip} are required' 
            });
        }

        await connection.beginTransaction();

        // 1. Insert into shows. Note: end_time will be calculated automatically by trigger trg_shows_before_insert
        // If there is an overlap, the trigger will SIGNAL SQLSTATE '45000' and throw here!
        const [showResult] = await connection.query(`
            INSERT INTO shows (movie_id, screen_id, show_time, end_time)
            VALUES (?, ?, ?, NOW())
        `, [movie_id, screen_id, show_time]);

        const showId = showResult.insertId;

        // 2. Insert category pricing
        const pricingEntries = [
            [showId, 'regular', prices.regular || 150],
            [showId, 'premium', prices.premium || 250],
            [showId, 'vip',     prices.vip || 400]
        ];

        await connection.query(`
            INSERT INTO show_pricing (show_id, category, price)
            VALUES ?
        `, [pricingEntries]);

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Show scheduled successfully',
            showId
        });
    } catch (err) {
        await connection.rollback();
        // Check if error was thrown by our MySQL overlap trigger
        if (err.sqlState === '45000') {
            return res.status(409).json({
                success: false,
                error: err.message || 'Show schedule conflict: Another show is running on this screen.'
            });
        }
        next(err);
    } finally {
        connection.release();
    }
});

module.exports = router;
