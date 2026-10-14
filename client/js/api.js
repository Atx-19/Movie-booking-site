// ================================================================
// API Service & Session Management
// ================================================================

const API_BASE = '/api';

const api = {
    async get(endpoint) {
        try {
            const res = await fetch(`${API_BASE}${endpoint}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Network request failed');
            return data;
        } catch (err) {
            console.error(`GET ${endpoint} failed:`, err);
            throw err;
        }
    },

    async post(endpoint, body) {
        try {
            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!res.ok) {
                const error = new Error(data.error || 'Network request failed');
                error.status = res.status;
                error.data = data;
                throw error;
            }
            return data;
        } catch (err) {
            console.error(`POST ${endpoint} failed:`, err);
            throw err;
        }
    },

    async delete(endpoint) {
        try {
            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Network request failed');
            return data;
        } catch (err) {
            console.error(`DELETE ${endpoint} failed:`, err);
            throw err;
        }
    }
};

// Current Active User Management (Student demo profile switcher)
const session = {
    getUser() {
        const stored = localStorage.getItem('active_user');
        if (stored) {
            try { return JSON.parse(stored); } catch (e) {}
        }
        // Default to Aarav Sharma (user_id = 3)
        const defaultUser = { user_id: 3, name: 'Aarav Sharma', role: 'customer' };
        localStorage.setItem('active_user', JSON.stringify(defaultUser));
        return defaultUser;
    },

    setUser(user) {
        localStorage.setItem('active_user', JSON.stringify(user));
        window.dispatchEvent(new Event('userChanged'));
    }
};
