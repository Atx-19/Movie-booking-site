// ================================================================
// Booking Confirmation Logic (/client/confirm.html)
// Handles 409 Conflict (Pessimistic lock / duplicate booking detection)
// ================================================================

document.addEventListener('DOMContentLoaded', () => {
    const rawData = sessionStorage.getItem('pending_booking');
    if (!rawData) {
        alert('No pending booking found. Please select your seats.');
        window.location.href = 'shows.html';
        return;
    }

    const booking = JSON.parse(rawData);
    const activeUser = session.getUser();

    const confMovieTitle = document.getElementById('confMovieTitle');
    const confVenueDetails = document.getElementById('confVenueDetails');
    const confSeatsList = document.getElementById('confSeatsList');
    const confUserName = document.getElementById('confUserName');
    const confTotalAmount = document.getElementById('confTotalAmount');
    const paymentForm = document.getElementById('paymentForm');
    const btnPay = document.getElementById('btnPay');
    const alertBox = document.getElementById('alertBox');
    const summaryCard = document.getElementById('summaryCard');
    const receiptCard = document.getElementById('receiptCard');

    // Populate summary card
    confMovieTitle.textContent = booking.movieTitle;
    const dateStr = new Date(booking.showTime).toLocaleString('en-IN', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
    confVenueDetails.textContent = `🏛️ ${booking.theatreName} • 📺 ${booking.screenName} • 🕒 ${dateStr}`;
    confSeatsList.textContent = booking.seats.map(s => s.label).join(', ');
    confUserName.textContent = `${activeUser.name} (${activeUser.role})`;
    confTotalAmount.textContent = `₹${booking.totalAmount.toFixed(2)}`;

    // Submit Booking
    paymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        alertBox.innerHTML = '';
        btnPay.disabled = true;
        btnPay.textContent = '⏳ Processing Transaction...';

        const payload = {
            user_id: activeUser.user_id,
            show_id: booking.showId,
            seat_ids: booking.seats.map(s => s.seat_id),
            payment_method: document.getElementById('paymentMethod').value
        };

        try {
            const res = await api.post('/bookings', payload);

            if (res.success) {
                // Success! Show receipt
                sessionStorage.removeItem('pending_booking');
                summaryCard.style.display = 'none';
                receiptCard.style.display = 'block';

                document.getElementById('recBookingId').textContent = res.booking_id;
                document.getElementById('recMovie').textContent = booking.movieTitle;
                document.getElementById('recSeats').textContent = booking.seats.map(s => s.label).join(', ');
                document.getElementById('recAmount').textContent = `₹${booking.totalAmount.toFixed(2)}`;
            }
        } catch (err) {
            btnPay.disabled = false;
            btnPay.textContent = '🔒 Pay & Confirm Booking';

            // ⭐ SHOWPIECE ERROR HANDLING: 409 Conflict
            if (err.status === 409 || (err.data && err.data.isConflict)) {
                alertBox.innerHTML = `
                    <div class="alert alert-danger">
                        <strong>⚠️ Seat Conflict Detected (409 Conflict)!</strong><br>
                        ${err.message || 'One or more selected seats were just reserved by another user.'}<br>
                        <em>The database transaction performed a clean ROLLBACK. Please choose different seats.</em>
                        <div style="margin-top: 0.75rem;">
                            <a href="seats.html?showId=${booking.showId}" class="btn btn-secondary" style="font-size: 0.85rem;">
                                ⬅ Return to Seat Map
                            </a>
                        </div>
                    </div>
                `;
            } else {
                alertBox.innerHTML = `
                    <div class="alert alert-danger">
                        <strong>Booking Failed:</strong> ${err.message}
                    </div>
                `;
            }
        }
    });
});
