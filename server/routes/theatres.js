// ================================================================
// Routes: Theatres (/api/theatres)
// ================================================================
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/theatres - List all theatres with screen count
router.get('/', async (req, res, next) => {
    try {
        const { city } = req.query;
        let sql = `
            SELECT 
                t.theatre_id,
                t.name,
                t.city,
                t.address,
                COUNT(s.screen_id) AS total_screens
            FROM theatres t
            LEFT JOIN screens s ON t.theatre_id = s.theatre_id
        `;
        const params = [];

        if (city) {
            sql += ' WHERE t.city = ?';
            params.push(city);
        }

        sql += ' GROUP BY t.theatre_id ORDER BY t.city, t.name';

        const [theatres] = await db.query(sql, params);
        res.json({ success: true, count: theatres.length, data: theatres });
    } catch (err) {
        next(err);
    }
});

// GET /api/theatres/:id/screens - Get screens for a theatre
router.get('/:id/screens', async (req, res, next) => {
    try {
        const { id } = req.params;
        const [screens] = await db.query(`
            SELECT screen_id, theatre_id, screen_name, total_seats
            FROM screens
            WHERE theatre_id = ?
            ORDER BY screen_name ASC
        `, [id]);

        res.json({ success: true, data: screens });
    } catch (err) {
        next(err);
    }
});

// POST /api/theatres - Create a new theatre (Admin)
router.post('/', async (req, res, next) => {
    try {
        const { name, city, address } = req.body;
        if (!name || !city) {
            return res.status(400).json({ success: false, error: 'Name and city are required' });
        }

        const [result] = await db.query(`
            INSERT INTO theatres (name, city, address)
            VALUES (?, ?, ?)
        `, [name, city, address || null]);

        res.status(201).json({
            success: true,
            message: 'Theatre created successfully',
            theatreId: result.insertId
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
