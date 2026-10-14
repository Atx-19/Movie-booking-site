// ================================================================
// Database Connection Pool configuration (mysql2/promise)
// ================================================================
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'movie_booking',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true // Allows executing multi-statement scripts & SP result sets
});

// Test the connection pool on initialization
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Connected to MySQL database:', process.env.DB_NAME || 'movie_booking');
        connection.release();
    } catch (err) {
        console.error('❌ MySQL Connection Failed:', err.message);
        console.error('👉 Make sure MySQL is running and your .env credentials match.');
    }
})();

module.exports = pool;
