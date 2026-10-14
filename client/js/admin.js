// ================================================================
// Admin Dashboard Logic (/client/admin.html)
// ================================================================

document.addEventListener('DOMContentLoaded', async () => {
    const sMovie = document.getElementById('sMovie');
    const sScreen = document.getElementById('sScreen');
    const addMovieForm = document.getElementById('addMovieForm');
    const scheduleShowForm = document.getElementById('scheduleShowForm');
    const adminAlert = document.getElementById('adminAlert');

    // 1. Populate Movies and Screens Dropdowns
    async function loadFormDropdowns() {
        try {
            const [moviesRes, theatresRes] = await Promise.all([
                api.get('/movies'),
                api.get('/theatres')
            ]);

            if (moviesRes.success && sMovie) {
                sMovie.innerHTML = '<option value="">-- Choose Movie --</option>' +
                    moviesRes.data.map(m => `
                        <option value="${m.movie_id}">${m.title} (${m.duration_min}m)</option>
                    `).join('');
            }

            if (theatresRes.success && sScreen) {
                // Fetch screens for each theatre
                const screenOptions = [];
                for (const t of theatresRes.data) {
                    const screensRes = await api.get(`/theatres/${t.theatre_id}/screens`);
                    if (screensRes.success) {
                        screensRes.data.forEach(sc => {
                            screenOptions.push(`
                                <option value="${sc.screen_id}">
                                    ${t.name} (${t.city}) — ${sc.screen_name} (${sc.total_seats} seats)
                                </option>
                            `);
                        });
                    }
                }
                sScreen.innerHTML = '<option value="">-- Choose Screen --</option>' + screenOptions.join('');
            }
        } catch (err) {
            console.error('Error loading admin dropdowns:', err);
        }
    }

    // 2. Add Movie Handler
    addMovieForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        adminAlert.innerHTML = '';

        const payload = {
            title: document.getElementById('mTitle').value.trim(),
            duration_min: parseInt(document.getElementById('mDuration').value, 10),
            language: document.getElementById('mLanguage').value.trim(),
            release_date: document.getElementById('mReleaseDate').value || null,
            description: document.getElementById('mDescription').value.trim() || null
        };

        try {
            const res = await api.post('/movies', payload);
            if (res.success) {
                adminAlert.innerHTML = `
                    <div class="alert alert-success">
                        ✅ Movie "${payload.title}" added to database with ID #${res.movieId}!
                    </div>
                `;
                addMovieForm.reset();
                loadFormDropdowns();
            }
        } catch (err) {
            adminAlert.innerHTML = `
                <div class="alert alert-danger">
                    ❌ Failed to add movie: ${err.message}
                </div>
            `;
        }
    });

    // 3. Schedule Show Handler (Demonstrates MySQL Overlap Trigger!)
    scheduleShowForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        adminAlert.innerHTML = '';

        const rawTime = document.getElementById('sShowTime').value; // 'YYYY-MM-DDTHH:MM'
        const formattedTime = rawTime.replace('T', ' ') + ':00';

        const payload = {
            movie_id: parseInt(sMovie.value, 10),
            screen_id: parseInt(sScreen.value, 10),
            show_time: formattedTime,
            prices: {
                regular: parseFloat(document.getElementById('pReg').value),
                premium: parseFloat(document.getElementById('pPrem').value),
                vip: parseFloat(document.getElementById('pVip').value)
            }
        };

        try {
            const res = await api.post('/shows', payload);
            if (res.success) {
                adminAlert.innerHTML = `
                    <div class="alert alert-success">
                        ✅ Show scheduled successfully! Auto-calculated end_time via BEFORE INSERT trigger.
                    </div>
                `;
                scheduleShowForm.reset();
            }
        } catch (err) {
            // Check if triggered by trg_shows_before_insert
            adminAlert.innerHTML = `
                <div class="alert alert-danger">
                    <strong>⚠️ Trigger Validation Triggered:</strong><br>
                    ${err.message}
                </div>
            `;
        }
    });

    await loadFormDropdowns();
});
