// ================================================================
// Routes: Bookings (/api/bookings) — ⭐ CORE SHOWPIECE
// Invokes stored procedure sp_book_tickets for concurrency control
// ================================================================
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST /api/bookings - Book tickets using sp_book_tickets
router.post('/', async (req, res, next) => {
    const connection = await db.getConnection();
    try {
        const { user_id, show_id, seat_ids, payment_method } = req.body;

        if (!user_id || !show_id || !seat_ids || !Array.isArray(seat_ids) || seat_ids.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'user_id, show_id, and an array of seat_ids are required'
            });
        }

        const seatIdStr = seat_ids.join(',');
        const method = payment_method || 'upi';

        // Call the stored procedure sp_book_tickets
        // Note: mysql2 with multipleStatements allows calling SP and reading OUT parameters
        const querySql = `
            CALL sp_book_tickets(?, ?, ?, ?, @b_id, @status, @msg);
            SELECT @b_id AS booking_id, @status AS status, @msg AS message;
        `;

        const [results] = await connection.query(querySql, [
            user_id,
            show_id,
            seatIdStr,
            method
        ]);

        // Second result set contains the SELECT @b_id, @status, @msg output
        const outputRow = results[1][0];
        const { booking_id, status, message } = outputRow;

        if (status === 'ERROR') {
            // Check if it was a seat conflict
            if (message && message.toLowerCase().includes('already booked')) {
                return res.status(409).json({
                    success: false,
                    error: message,
                    isConflict: true
                });
            }
            return res.status(400).json({
                success: false,
                error: message
            });
        }

        res.status(201).json({
            success: true,
            booking_id,
            message
        });

    } catch (err) {
        next(err);
    } finally {
        connection.release();
    }
});

// DELETE /api/bookings/:id - Cancel a booking
// Business rule: Frees booked seats, sets status to 'cancelled', triggers audit log entry
router.delete('/:id', async (req, res, next) => {
    const connection = await db.getConnection();
    try {
        const { id } = req.params;

        await connection.beginTransaction();

        // 1. Check if booking exists
        const [bookings] = await connection.query(
            'SELECT booking_id, status, total_amount, user_id FROM bookings WHERE booking_id = ?',
            [id]
        );

        if (bookings.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        const booking = bookings[0];

        if (booking.status === 'cancelled') {
            await connection.rollback();
            return res.status(400).json({ success: false, error: 'Booking is already cancelled' });
        }

        // 2. DELETE from booking_seats (FREES THE SEATS for future bookings)
        await connection.query('DELETE FROM booking_seats WHERE booking_id = ?', [id]);

        // 3. Update booking status to 'cancelled' (fires trigger trg_bookings_after_update -> audit_log)
        await connection.query('UPDATE bookings SET status = "cancelled" WHERE booking_id = ?', [id]);

        // 4. Update payment status to 'refunded'
        await connection.query('UPDATE payments SET status = "refunded" WHERE booking_id = ?', [id]);

        await connection.commit();

        res.json({
            success: true,
            message: 'Booking cancelled successfully. Seats have been released and refund processed.',
            bookingId: parseInt(id, 10)
        });

    } catch (err) {
        await connection.rollback();
        next(err);
    } finally {
        connection.release();
    }
});

// GET /api/bookings/user/:userId - Retrieve user booking history
router.get('/user/:userId', async (req, res, next) => {
    try {
        const { userId } = req.params;

        const [history] = await db.query(`
            SELECT 
                b.booking_id,
                b.status AS booking_status,
                b.total_amount,
                b.booking_time,
                m.title AS movie_title,
                m.poster_url,
                t.name AS theatre_name,
                t.city,
                sc.screen_name,
                s.show_time,
                GROUP_CONCAT(CONCAT(st.row_label, st.seat_number) ORDER BY st.row_label, st.seat_number SEPARATOR ', ') AS seats,
                p.payment_method,
                p.status AS payment_status
            FROM bookings b
            JOIN shows s          ON b.show_id = s.show_id
            JOIN movies m         ON s.movie_id = m.movie_id
            JOIN screens sc       ON s.screen_id = sc.screen_id
            JOIN theatres t       ON sc.theatre_id = t.theatre_id
            LEFT JOIN booking_seats bs ON b.booking_id = bs.booking_id
            LEFT JOIN seats st         ON bs.seat_id = st.seat_id
            LEFT JOIN payments p       ON b.booking_id = p.booking_id
            WHERE b.user_id = ?
            GROUP BY b.booking_id
            ORDER BY b.booking_time DESC
        `, [userId]);

        res.json({
            success: true,
            count: history.length,
            data: history
        });

    } catch (err) {
        next(err);
    }
});

// GET /api/bookings/:id - Single booking confirmation receipt
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(`
            SELECT 
                b.booking_id,
                b.status,
                b.total_amount,
                b.booking_time,
                u.name AS customer_name,
                u.email AS customer_email,
                m.title AS movie_title,
                t.name AS theatre_name,
                t.city,
                sc.screen_name,
                s.show_time,
                GROUP_CONCAT(CONCAT(st.row_label, st.seat_number, ' (', st.category, ')') SEPARATOR ', ') AS seats,
                p.payment_method,
                p.status AS payment_status
            FROM bookings b
            JOIN users u          ON b.user_id = u.user_id
            JOIN shows s          ON b.show_id = s.show_id
            JOIN movies m         ON s.movie_id = m.movie_id
            JOIN screens sc       ON s.screen_id = sc.screen_id
            JOIN theatres t       ON sc.theatre_id = t.theatre_id
            LEFT JOIN booking_seats bs ON b.booking_id = bs.booking_id
            LEFT JOIN seats st         ON bs.seat_id = st.seat_id
            LEFT JOIN payments p       ON b.booking_id = p.booking_id
            WHERE b.booking_id = ?
            GROUP BY b.booking_id
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        res.json({ success: true, data: rows[0] });

    } catch (err) {
        next(err);
    }
});

module.exports = router;
