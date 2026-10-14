// ================================================================
// Routes: Users (/api/users)
// ================================================================
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/users - List users (for frontend profile switching / demo)
router.get('/', async (req, res, next) => {
    try {
        const [users] = await db.query(`
            SELECT user_id, name, email, phone, role, created_at
            FROM users
            ORDER BY role DESC, name ASC
        `);
        res.json({ success: true, data: users });
    } catch (err) {
        next(err);
    }
});

// POST /api/users/login - Simple demo login (by email)
router.post('/login', async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, error: 'Email is required' });
        }

        const [users] = await db.query(`
            SELECT user_id, name, email, role
            FROM users
            WHERE email = ?
        `, [email]);

        if (users.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found with this email' });
        }

        res.json({
            success: true,
            message: 'Logged in successfully',
            user: users[0]
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
