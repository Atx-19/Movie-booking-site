// ================================================================
// My Bookings Page Logic (/client/my-bookings.html)
// ================================================================

document.addEventListener('DOMContentLoaded', () => {
    const bookingsList = document.getElementById('bookingsList');
    const alertBox = document.getElementById('alertBox');

    async function loadBookings() {
        const user = session.getUser();

        try {
            bookingsList.innerHTML = '<p style="color: var(--text-muted);">Fetching reservations...</p>';
            const res = await api.get(`/bookings/user/${user.user_id}`);

            if (!res.success || res.data.length === 0) {
                bookingsList.innerHTML = `
                    <div class="form-card" style="text-align: center; color: var(--text-muted);">
                        <p>No bookings found for <strong>${user.name}</strong>.</p>
                        <a href="index.html" class="btn btn-primary" style="margin-top: 1rem;">Explore Movies</a>
                    </div>
                `;
                return;
            }

            bookingsList.innerHTML = res.data.map(b => {
                const showDate = new Date(b.show_time).toLocaleString('en-IN', {
                    weekday: 'short', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });
                const bookedAt = new Date(b.booking_time).toLocaleString('en-IN', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });

                const badgeClass = `badge-${b.booking_status}`;
                const canCancel = b.booking_status === 'confirmed';

                return `
                    <div class="form-card" style="max-width: 100%; margin: 0;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; border-bottom: 1px solid var(--border); padding-bottom: 0.75rem;">
                            <div>
                                <h2 style="font-size: 1.3rem; color: var(--primary);">${b.movie_title}</h2>
                                <span style="font-size: 0.85rem; color: var(--text-muted);">Booking #${b.booking_id} • Booked on ${bookedAt}</span>
                            </div>
                            <span class="badge ${badgeClass}">${b.booking_status}</span>
                        </div>

                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.25rem;">
                            <div>
                                <div style="font-size: 0.8rem; color: var(--text-muted);">THEATRE & SCREEN</div>
                                <div style="font-weight: 600;">${b.theatre_name} (${b.city})</div>
                                <div style="font-size: 0.85rem; color: var(--accent);">${b.screen_name}</div>
                            </div>
                            <div>
                                <div style="font-size: 0.8rem; color: var(--text-muted);">SHOW TIME</div>
                                <div style="font-weight: 600;">${showDate}</div>
                            </div>
                            <div>
                                <div style="font-size: 0.8rem; color: var(--text-muted);">SEATS ALLOCATED</div>
                                <div style="font-weight: 600; color: var(--accent);">${b.seats || 'None (Freed)'}</div>
                            </div>
                            <div>
                                <div style="font-size: 0.8rem; color: var(--text-muted);">TOTAL PAID</div>
                                <div style="font-weight: 700; color: var(--primary); font-size: 1.1rem;">₹${parseFloat(b.total_amount).toFixed(2)}</div>
                                <div style="font-size: 0.75rem; color: var(--text-muted);">Via ${b.payment_method ? b.payment_method.toUpperCase() : 'N/A'}</div>
                            </div>
                        </div>

                        ${canCancel ? `
                            <div style="display: flex; justify-content: flex-end; border-top: 1px solid var(--border); padding-top: 1rem;">
                                <button class="btn btn-danger btn-cancel" data-id="${b.booking_id}">
                                    Cancel Booking & Free Seats
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('');

            // Attach cancel handlers
            document.querySelectorAll('.btn-cancel').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const bookingId = e.target.dataset.id;
                    if (!confirm(`Are you sure you want to cancel Booking #${bookingId}? This will free your reserved seats immediately.`)) {
                        return;
                    }

                    try {
                        const cancelRes = await api.delete(`/bookings/${bookingId}`);
                        if (cancelRes.success) {
                            alertBox.innerHTML = `
                                <div class="alert alert-success">
                                    ✅ ${cancelRes.message} (Logged to Audit Trail)
                                </div>
                            `;
                            loadBookings();
                        }
                    } catch (err) {
                        alertBox.innerHTML = `
                            <div class="alert alert-danger">
                                ❌ Cancellation failed: ${err.message}
                            </div>
                        `;
                    }
                });
            });

        } catch (err) {
            bookingsList.innerHTML = `<p style="color: var(--danger);">Failed to load bookings: ${err.message}</p>`;
        }
    }

    loadBookings();
});
