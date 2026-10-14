// ================================================================
// Reports Page Logic (/client/reports.html)
// ================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Movie Revenue View (v_movie_revenue)
    async function loadMovieRevenue() {
        const tbody = document.querySelector('#movieRevenueTable tbody');
        try {
            const res = await api.get('/reports/movie-revenue');
            if (res.success && res.data.length > 0) {
                tbody.innerHTML = res.data.map(row => `
                    <tr>
                        <td style="font-weight: 600;">${row.movie_title}</td>
                        <td>${row.language}</td>
                        <td>${row.total_bookings}</td>
                        <td>${row.total_tickets_sold}</td>
                        <td style="color: var(--primary); font-weight: 700;">₹${parseFloat(row.total_revenue).toFixed(2)}</td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="5">No revenue recorded yet.</td></tr>';
            }
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="5" style="color: var(--danger);">${err.message}</td></tr>`;
        }
    }

    // 2. Live Show Availability View (v_show_availability)
    async function loadShowAvailability() {
        const tbody = document.querySelector('#showAvailabilityTable tbody');
        try {
            const res = await api.get('/reports/show-availability');
            if (res.success && res.data.length > 0) {
                tbody.innerHTML = res.data.map(row => {
                    const dateStr = new Date(row.show_time).toLocaleString('en-IN', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    });
                    const availColor = row.available_seats > 5 ? 'var(--success)' : 'var(--danger)';

                    return `
                        <tr>
                            <td>#${row.show_id}</td>
                            <td style="font-weight: 600;">${row.movie_title}</td>
                            <td>${row.theatre_name}</td>
                            <td>${row.screen_name}</td>
                            <td>${dateStr}</td>
                            <td>${row.total_seats}</td>
                            <td style="color: var(--text-muted);">${row.booked_seats}</td>
                            <td style="color: ${availColor}; font-weight: 700;">${row.available_seats}</td>
                        </tr>
                    `;
                }).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="8">No shows scheduled.</td></tr>';
            }
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="8" style="color: var(--danger);">${err.message}</td></tr>`;
        }
    }

    // 3. Busiest Theatres (GROUP BY + HAVING)
    async function loadBusiestTheatres() {
        const tbody = document.querySelector('#busiestTheatresTable tbody');
        try {
            const res = await api.get('/reports/busiest-theatres?minBookings=2');
            if (res.success && res.data.length > 0) {
                tbody.innerHTML = res.data.map(row => `
                    <tr>
                        <td style="font-weight: 600;">${row.theatre_name}</td>
                        <td>${row.city}</td>
                        <td style="color: var(--accent); font-weight: 600;">${row.confirmed_bookings_count} bookings</td>
                        <td style="color: var(--primary); font-weight: 700;">₹${parseFloat(row.total_theatre_revenue).toFixed(2)}</td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="4">No theatres meeting threshold.</td></tr>';
            }
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="4" style="color: var(--danger);">${err.message}</td></tr>`;
        }
    }

    // 4. Top-Rated Movies (Scalar Subquery)
    async function loadTopRated() {
        const tbody = document.querySelector('#topRatedTable tbody');
        try {
            const res = await api.get('/reports/top-rated-movies');
            if (res.success && res.data.length > 0) {
                tbody.innerHTML = res.data.map(row => `
                    <tr>
                        <td style="font-weight: 600;">${row.title}</td>
                        <td style="color: var(--primary); font-weight: 700;">⭐ ${row.movie_avg_rating}</td>
                        <td>${row.review_count}</td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="3">No movies above average rating.</td></tr>';
            }
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="3" style="color: var(--danger);">${err.message}</td></tr>`;
        }
    }

    // 5. Trigger Audit Logs (audit_log)
    async function loadAuditLogs() {
        const tbody = document.querySelector('#auditLogTable tbody');
        try {
            const res = await api.get('/reports/audit-logs');
            if (res.success && res.data.length > 0) {
                tbody.innerHTML = res.data.map(row => {
                    const timeStr = new Date(row.action_time).toLocaleString('en-IN', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    });

                    return `
                        <tr>
                            <td>#${row.log_id}</td>
                            <td><span class="badge badge-cancelled">${row.action}</span></td>
                            <td>Booking #${row.record_id}</td>
                            <td><code>${row.old_values || '—'}</code></td>
                            <td><code>${row.new_values || '—'}</code></td>
                            <td>${row.performed_by_user || 'System'}</td>
                            <td style="font-size: 0.8rem; color: var(--text-muted);">${timeStr}</td>
                        </tr>
                    `;
                }).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="7">No audit events recorded.</td></tr>';
            }
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="7" style="color: var(--danger);">${err.message}</td></tr>`;
        }
    }

    await Promise.all([
        loadMovieRevenue(),
        loadShowAvailability(),
        loadBusiestTheatres(),
        loadTopRated(),
        loadAuditLogs()
    ]);
});
