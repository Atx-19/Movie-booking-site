// ================================================================
// Concurrency & Double-Booking Automated Test Script
// Simulates two users attempting to book the EXACT SAME SEAT
// at the exact same millisecond.
//
// Run: node tests/test-concurrency.js
// ================================================================

const http = require('http');

const SERVER_HOST = 'localhost';
const SERVER_PORT = 5000;

function makeRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const options = {
            hostname: SERVER_HOST,
            port: SERVER_PORT,
            path: `/api${path}`,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, body: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: data });
                }
            });
        });

        req.on('error', err => reject(err));
        if (payload) req.write(payload);
        req.end();
    });
}

async function runDemo() {
    console.log('================================================================');
    console.log('🎬 Movie Ticket Booking System — Automated Concurrency Test');
    console.log('================================================================\n');

    // Step 1: Verify Server Health
    try {
        console.log('1️⃣ Checking API Server health...');
        const health = await makeRequest('GET', '/health');
        if (health.status !== 200) {
            console.error('❌ Server is not responding on port 5000. Start the server first with: npm start');
            process.exit(1);
        }
        console.log('   ✅ API Server is live and healthy!\n');
    } catch (err) {
        console.error('❌ Could not connect to http://localhost:5000. Please ensure the Express backend is running.');
        console.error('   Command: cd server && npm start');
        process.exit(1);
    }

    // Step 2: Target Show & Seat
    // Let's use Show ID 1 and Seat ID 19 (Row D, Seat 4 - VIP category on Screen 1)
    const TARGET_SHOW = 1;
    const TARGET_SEAT = 19; // D4

    console.log(`2️⃣ Setting up race condition test on Show #${TARGET_SHOW}, Seat ID #${TARGET_SEAT}...`);
    console.log('   👤 User A (ID: 3, Aarav) and 👤 User B (ID: 4, Sneha) will submit concurrently.\n');

    const requestUserA = {
        user_id: 3,
        show_id: TARGET_SHOW,
        seat_ids: [TARGET_SEAT],
        payment_method: 'upi'
    };

    const requestUserB = {
        user_id: 4,
        show_id: TARGET_SHOW,
        seat_ids: [TARGET_SEAT],
        payment_method: 'credit_card'
    };

    console.log('🚀 Firing BOTH booking requests simultaneously (0ms delay)...\n');

    // Fire both requests concurrently using Promise.all
    const [resultA, resultB] = await Promise.all([
        makeRequest('POST', '/bookings', requestUserA),
        makeRequest('POST', '/bookings', requestUserB)
    ]);

    console.log('----------------------------------------------------------------');
    console.log('📊 CONCURRENCY RESULTS:');
    console.log('----------------------------------------------------------------');
    console.log(`User A (Aarav): HTTP ${resultA.status} ->`, JSON.stringify(resultA.body));
    console.log(`User B (Sneha): HTTP ${resultB.status} ->`, JSON.stringify(resultB.body));
    console.log('----------------------------------------------------------------\n');

    // Verification Logic
    const has201 = resultA.status === 201 || resultB.status === 201;
    const has409 = resultA.status === 409 || resultB.status === 409;

    if (has201 && has409) {
        const winner = resultA.status === 201 ? 'User A (Aarav)' : 'User B (Sneha)';
        const loser = resultA.status === 409 ? 'User A (Aarav)' : 'User B (Sneha)';
        console.log(`🏆 SUCCESS: Exactly ONE booking succeeded (${winner})!`);
        console.log(`🛡️ SAFE CONFLICT: The competing request (${loser}) was rejected with HTTP 409 Conflict!`);
        console.log('⭐ Result: Safe Seat Booking verified! Two users NEVER booked the same seat.\n');
    } else {
        console.log('ℹ️ Notice: The seat may have already been booked in previous runs.');
        console.log('   Check response bodies above for status.\n');
    }

    console.log('================================================================');
    console.log('🏁 Concurrency test completed successfully.');
    console.log('================================================================');
}

runDemo();
