// ================================================================
// Centralized Error Handling Middleware
// ================================================================

function errorHandler(err, req, res, next) {
    console.error('🔥 Server Error:', err);

    // MySQL specific error codes
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            success: false,
            error: 'Conflict: A record with these unique details already exists.',
            details: err.message
        });
    }

    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({
            success: false,
            error: 'Foreign key constraint failed: Referenced record does not exist.',
            details: err.message
        });
    }

    const statusCode = err.status || 500;
    res.status(statusCode).json({
        success: false,
        error: err.message || 'Internal Server Error'
    });
}

module.exports = errorHandler;
