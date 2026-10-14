// ================================================================
// Routes: Reviews (/api/reviews)
// ================================================================
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST /api/reviews - Add or update a review
router.post('/', async (req, res, next) => {
    try {
        const { user_id, movie_id, rating, review_text } = req.body;

        if (!user_id || !movie_id || !rating) {
            return res.status(400).json({ success: false, error: 'user_id, movie_id, and rating (1-5) are required' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, error: 'Rating must be an integer between 1 and 5' });
        }

        // Uses ON DUPLICATE KEY UPDATE so user can update their existing review
        const [result] = await db.query(`
            INSERT INTO reviews (user_id, movie_id, rating, review_text)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                rating = VALUES(rating),
                review_text = VALUES(review_text),
                created_at = CURRENT_TIMESTAMP
        `, [user_id, movie_id, rating, review_text || null]);

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            reviewId: result.insertId
        });
    } catch (err) {
        next(err);
    }
});

// GET /api/reviews/movie/:movieId - List reviews for a specific movie
router.get('/movie/:movieId', async (req, res, next) => {
    try {
        const { movieId } = req.params;
        const [reviews] = await db.query(`
            SELECT 
                r.review_id,
                r.rating,
                r.review_text,
                r.created_at,
                u.user_id,
                u.name AS reviewer_name
            FROM reviews r
            JOIN users u ON r.user_id = u.user_id
            WHERE r.movie_id = ?
            ORDER BY r.created_at DESC
        `, [movieId]);

        res.json({ success: true, count: reviews.length, data: reviews });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
