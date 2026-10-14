// ================================================================
// Shared Navbar & User Switcher Component
// ================================================================

document.addEventListener('DOMContentLoaded', async () => {
    const navPlaceholder = document.getElementById('navbar-placeholder');
    if (!navPlaceholder) return;

    const currentPath = window.location.pathname.split('/').pop() || 'index.html';

    navPlaceholder.innerHTML = `
        <nav class="navbar">
            <div class="nav-container">
                <a href="index.html" class="brand">
                    <span class="brand-icon">🎟️</span>
                    <span>CineBook DB</span>
                </a>
                <ul class="nav-links">
                    <li><a href="index.html" class="${currentPath === 'index.html' ? 'active' : ''}">Movies</a></li>
                    <li><a href="shows.html" class="${currentPath === 'shows.html' ? 'active' : ''}">Show Timings</a></li>
                    <li><a href="my-bookings.html" class="${currentPath === 'my-bookings.html' ? 'active' : ''}">My Bookings</a></li>
                    <li><a href="reports.html" class="${currentPath === 'reports.html' ? 'active' : ''}">Reports</a></li>
                    <li><a href="admin.html" class="${currentPath === 'admin.html' ? 'active' : ''}">Admin</a></li>
                </ul>
                <div class="user-selector">
                    <span>👤 Active User:</span>
                    <select id="activeUserSelect"></select>
                </div>
            </div>
        </nav>
    `;

    // Populate user switcher
    try {
        const res = await api.get('/users');
        const select = document.getElementById('activeUserSelect');
        const currentUser = session.getUser();

        if (res.success && select) {
            select.innerHTML = res.data.map(u => `
                <option value="${u.user_id}" ${u.user_id === currentUser.user_id ? 'selected' : ''}>
                    ${u.name} (${u.role})
                </option>
            `).join('');

            select.addEventListener('change', (e) => {
                const selectedUser = res.data.find(u => u.user_id === parseInt(e.target.value, 10));
                if (selectedUser) {
                    session.setUser(selectedUser);
                    window.location.reload();
                }
            });
        }
    } catch (err) {
        console.warn('Could not load user profiles:', err);
    }
});
