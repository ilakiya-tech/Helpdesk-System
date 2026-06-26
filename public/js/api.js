// api.js  –  Carbochem Helpdesk Frontend API Client
// Talks directly to the C backend on port 9090

const API = {
    baseURL: 'http://localhost:9090/api',

    getToken()    { return localStorage.getItem('token'); },
    getUsername() { return localStorage.getItem('username'); },
    getRole()     { return localStorage.getItem('userRole'); },

    _headers(withAuth = true) {
        const h = { 'Content-Type': 'application/json' };
        if (withAuth) h['Authorization'] = `Bearer ${this.getToken()}`;
        return h;
    },

    async _fetch(path, opts = {}) {
        try {
            const resp = await fetch(`${this.baseURL}${path}`, opts);
            return await resp.json();
        } catch (err) {
            console.error(`API error [${path}]:`, err);
            return { success: false, message: 'Network error – is the C server running on port 9090?' };
        }
    },

    /* ── Auth ─────────────────────────────────────────────────── */
    async login(username, password) {
        return this._fetch('/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
    },

    async registerUser(username, password, role) {
        return this._fetch('/register', {
            method: 'POST',
            headers: this._headers(),
            body: JSON.stringify({ username, password, role })
        });
    },

    /* ── Tickets ──────────────────────────────────────────────── */
    async getTickets() {
        return this._fetch('/tickets', { headers: this._headers() });
    },

    async getMyTickets() {
        return this._fetch('/mytickets', { headers: this._headers() });
    },

    async getAssigned() {
        return this._fetch('/assigned', { headers: this._headers() });
    },

    async getTicketById(ticketId) {
        return this._fetch(`/tickets/${ticketId}`, { headers: this._headers() });
    },

    async createTicket(title, description, priority = 'Medium', category = 'General',
                       customerName = '', email = '', mobile = '') {
        return this._fetch('/tickets', {
            method: 'POST',
            headers: this._headers(),
            body: JSON.stringify({ title, description, priority, category,
                                   customerName, email, mobile })
        });
    },

    async updateTicketStatus(ticketId, status) {
        return this._fetch(`/tickets/${ticketId}/status`, {
            method: 'PUT',
            headers: this._headers(),
            body: JSON.stringify({ status })
        });
    },

    async assignTicket(ticketId, staffUsername) {
        return this._fetch(`/tickets/${ticketId}/assign`, {
            method: 'PUT',
            headers: this._headers(),
            body: JSON.stringify({ staffUsername })
        });
    },

    /* ── Stats & Queue ────────────────────────────────────────── */
    async getStatistics() {
        return this._fetch('/stats', { headers: this._headers() });
    },

    async getQueue() {
        return this._fetch('/queue', { headers: this._headers() });
    }
};

window.API = API;