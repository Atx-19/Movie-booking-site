// ================================================================
// Movies Page Logic (/client/index.html)
// ================================================================

document.addEventListener('DOMContentLoaded', async () => {
    const movieGrid = document.getElementById('movieGrid');
    const searchInput = document.getElementById('searchInput');
    const genreFilter = document.getElementById('genreFilter');

    // 1. Load genres into filter dropdown
    async function loadGenres() {
        try {
            const res = await api.get('/movies/genres/all');
            if (res.success && genreFilter) {
                genreFilter.innerHTML = '<option value="">All Genres</option>' +
                    res.data.map(g => `<option value="${g.genre_name}">${g.genre_name}</option>`).join('');
            }
        } catch (err) {
            console.error('Error loading genres:', err);
        }
    }

    // 2. Load and render movie cards
    async function loadMovies() {
        const search = searchInput ? searchInput.value.trim() : '';
        const genre = genreFilter ? genreFilter.value : '';

        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (genre) params.append('genre', genre);

        try {
            movieGrid.innerHTML = '<p style="color: var(--text-muted);">Loading movies...</p>';
            const queryStr = params.toString() ? `?${params.toString()}` : '';
            const res = await api.get(`/movies${queryStr}`);

            if (!res.success || res.data.length === 0) {
                movieGrid.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1;">No movies found matching your filters.</p>';
                return;
            }

            movieGrid.innerHTML = res.data.map(m => {
                const genreTags = m.genres
                    ? m.genres.split(', ').map(g => `<span class="genre-tag">${g}</span>`).join('')
                    : '';
                const ratingBadge = m.avg_rating 
                    ? `<span class="movie-badge-rating">⭐ ${m.avg_rating}</span>`
                    : '<span class="movie-badge-rating">⭐ New</span>';

                return `
                    <div class="movie-card">
                        <div class="movie-poster-placeholder">
                            <span>🎬</span>
                            <span class="movie-badge-lang">${m.language}</span>
                            ${ratingBadge}
                        </div>
                        <div class="movie-info">
                            <h3 class="movie-title">${m.title}</h3>
                            <div class="movie-meta">⏳ ${m.duration_min} mins • Release: ${m.release_date ? m.release_date.substring(0, 10) : 'TBD'}</div>
                            <div class="movie-genres">${genreTags}</div>
                            <p class="movie-desc">${m.description || 'No overview provided.'}</p>
                            <a href="shows.html?movieId=${m.movie_id}" class="btn btn-primary btn-block">
                                Book Tickets
                            </a>
                        </div>
                    </div>
                `;
            }).join('');

        } catch (err) {
            movieGrid.innerHTML = `<p style="color: var(--danger);">Failed to load movies: ${err.message}</p>`;
        }
    }

    // Event listeners for instant search & filtering
    let searchTimer = null;
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(loadMovies, 300);
        });
    }

    if (genreFilter) {
        genreFilter.addEventListener('change', loadMovies);
    }

    await loadGenres();
    await loadMovies();
});
