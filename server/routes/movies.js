// ================================================================
// Routes: Movies (/api/movies)
// Raw SQL with mysql2/promise, parameterized queries
// ================================================================
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/movies/genres/all - Get all genres for filter dropdowns
router.get('/genres/all', async (req, res, next) => {
    try {
        const [genres] = await db.query('SELECT genre_id, genre_name FROM genres ORDER BY genre_name ASC');
        res.json({ success: true, data: genres });
    } catch (err) {
        next(err);
    }
});

// GET /api/movies - List all movies (with search & genre filter)
router.get('/', async (req, res, next) => {
    try {
        const { search, genre } = req.query;
        let sql = `
            SELECT 
                m.movie_id,
                m.title,
                m.duration_min,
                m.language,
                m.release_date,
                m.description,
                m.poster_url,
                ROUND(AVG(r.rating), 1) AS avg_rating,
                COUNT(r.review_id) AS total_reviews,
                GROUP_CONCAT(DISTINCT g.genre_name ORDER BY g.genre_name SEPARATOR ', ') AS genres
            FROM movies m
            LEFT JOIN movie_genres mg ON m.movie_id = mg.movie_id
            LEFT JOIN genres g        ON mg.genre_id = g.genre_id
            LEFT JOIN reviews r       ON m.movie_id = r.movie_id
        `;

        const conditions = [];
        const params = [];

        if (search) {
            conditions.push('(m.title LIKE ? OR m.description LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }

        if (genre) {
            conditions.push('m.movie_id IN (SELECT movie_id FROM movie_genres mg2 JOIN genres g2 ON mg2.genre_id = g2.genre_id WHERE g2.genre_name = ?)');
            params.push(genre);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' GROUP BY m.movie_id ORDER BY m.release_date DESC';

        const [movies] = await db.query(sql, params);
        res.json({ success: true, count: movies.length, data: movies });
    } catch (err) {
        next(err);
    }
});

// GET /api/movies/:id - Get detailed movie info + reviews
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const [movieRows] = await db.query(`
            SELECT 
                m.*,
                ROUND(AVG(r.rating), 1) AS avg_rating,
                COUNT(r.review_id) AS total_reviews,
                GROUP_CONCAT(DISTINCT g.genre_name ORDER BY g.genre_name SEPARATOR ', ') AS genres
            FROM movies m
            LEFT JOIN movie_genres mg ON m.movie_id = mg.movie_id
            LEFT JOIN genres g        ON mg.genre_id = g.genre_id
            LEFT JOIN reviews r       ON m.movie_id = r.movie_id
            WHERE m.movie_id = ?
            GROUP BY m.movie_id
        `, [id]);

        if (movieRows.length === 0) {
            return res.status(404).json({ success: false, error: 'Movie not found' });
        }

        // Fetch individual reviews
        const [reviews] = await db.query(`
            SELECT r.review_id, r.rating, r.review_text, r.created_at, u.name AS reviewer_name
            FROM reviews r
            JOIN users u ON r.user_id = u.user_id
            WHERE r.movie_id = ?
            ORDER BY r.created_at DESC
        `, [id]);

        res.json({
            success: true,
            data: {
                ...movieRows[0],
                reviews
            }
        });
    } catch (err) {
        next(err);
    }
});

// POST /api/movies - Add a new movie (Admin)
router.post('/', async (req, res, next) => {
    const connection = await db.getConnection();
    try {
        const { title, duration_min, language, release_date, description, poster_url, genre_ids } = req.body;

        if (!title || !duration_min) {
            return res.status(400).json({ success: false, error: 'Title and duration_min are required' });
        }

        await connection.beginTransaction();

        const [result] = await connection.query(`
            INSERT INTO movies (title, duration_min, language, release_date, description, poster_url)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [title, duration_min, language || 'English', release_date || null, description || null, poster_url || null]);

        const movieId = result.insertId;

        // If genres were passed, link them in movie_genres
        if (Array.isArray(genre_ids) && genre_ids.length > 0) {
            const values = genre_ids.map(gid => [movieId, gid]);
            await connection.query('INSERT INTO movie_genres (movie_id, genre_id) VALUES ?', [values]);
        }

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Movie created successfully',
            movieId
        });
    } catch (err) {
        await connection.rollback();
        next(err);
    } finally {
        connection.release();
    }
});

module.exports = router;
