// ================================================================
// Shows Page Logic (/client/shows.html)
// ================================================================

document.addEventListener('DOMContentLoaded', async () => {
    const movieSelect = document.getElementById('movieSelect');
    const citySelect = document.getElementById('citySelect');
    const showsContainer = document.getElementById('showsContainer');

    // Parse URL query parameter: ?movieId=1
    const urlParams = new URLSearchParams(window.location.search);
    const initialMovieId = urlParams.get('movieId') || '';

    // 1. Populate movie dropdown
    async function loadMoviesDropdown() {
        try {
            const res = await api.get('/movies');
            if (res.success && movieSelect) {
                movieSelect.innerHTML = '<option value="">All Movies</option>' +
                    res.data.map(m => `
                        <option value="${m.movie_id}" ${m.movie_id == initialMovieId ? 'selected' : ''}>
                            ${m.title} (${m.language})
                        </option>
                    `).join('');
            }
        } catch (err) {
            console.error('Error loading movie dropdown:', err);
        }
    }

    // 2. Load shows based on selected movie & city
    async function loadShows() {
        const movieId = movieSelect ? movieSelect.value : '';
        const city = citySelect ? citySelect.value : '';

        const params = new URLSearchParams();
        if (movieId) params.append('movie_id', movieId);
        if (city) params.append('city', city);

        try {
            showsContainer.innerHTML = '<p style="color: var(--text-muted);">Loading shows...</p>';
            const queryStr = params.toString() ? `?${params.toString()}` : '';
            const res = await api.get(`/shows${queryStr}`);

            if (!res.success || res.data.length === 0) {
                showsContainer.innerHTML = `
                    <div class="form-card" style="text-align: center; color: var(--text-muted);">
                        <p>No upcoming shows found for this selection.</p>
                        <a href="index.html" class="btn btn-secondary" style="margin-top: 1rem;">Back to Movies</a>
                    </div>
                `;
                return;
            }

            // Group shows by Theatre
            const grouped = {};
            res.data.forEach(show => {
                const key = `${show.theatre_name} — ${show.city}`;
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(show);
            });

            showsContainer.innerHTML = Object.entries(grouped).map(([venueName, venueShows]) => `
                <div class="form-card" style="max-width: 100%; margin: 0;">
                    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">
                        <h2 style="font-size: 1.25rem; color: var(--primary);">🏛️ ${venueName}</h2>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem;">
                        ${venueShows.map(s => {
                            const showDate = new Date(s.show_time).toLocaleString('en-IN', {
                                month: 'short', day: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                            });

                            return `
                                <div style="background: var(--bg-main); border: 1px solid var(--border); border-radius: 8px; padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between;">
                                    <div>
                                        <div style="font-weight: 700; font-size: 1.1rem; margin-bottom: 0.25rem;">${s.movie_title}</div>
                                        <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">
                                            📺 ${s.screen_name} • 🕒 ${showDate}
                                        </div>
                                        <div style="font-size: 0.8rem; color: var(--accent); margin-bottom: 1rem;">
                                            💵 ${s.pricing || 'Standard Pricing'}
                                        </div>
                                    </div>
                                    <a href="seats.html?showId=${s.show_id}" class="btn btn-primary btn-block">
                                        Select Seats
                                    </a>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `).join('');

        } catch (err) {
            showsContainer.innerHTML = `<p style="color: var(--danger);">Failed to load shows: ${err.message}</p>`;
        }
    }

    if (movieSelect) movieSelect.addEventListener('change', loadShows);
    if (citySelect) citySelect.addEventListener('change', loadShows);

    await loadMoviesDropdown();
    await loadShows();
});
