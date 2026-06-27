// api.js – Carbochem Helpdesk Frontend API Client
// Talks to Node.js backend on port 3000 (/api/*)

const API = {
  baseURL: '/api',

  getToken()    { return localStorage.getItem('token'); },
  getUsername() { return localStorage.getItem('username'); },
  getRole()     { return localStorage.getItem('userRole'); },
  getUserId()   { return localStorage.getItem('userId'); },

  _headers(withAuth = true) {
    const h = { 'Content-Type': 'application/json' };
    if (withAuth) h['Authorization'] = `Bearer ${this.getToken()}`;
    return h;
  },

  async _fetch(path, opts = {}) {
    try {
      const resp = await fetch(`${this.baseURL}${path}`, opts);
      const data = await resp.json();
      return data;
    } catch (err) {
      console.error(`API error [${path}]:`, err);
      return { success: false, message: 'Network error – is the server running?' };
    }
  },

  // ── Auth ──────────────────────────────────────────────────────────────
  async login(username, password) {
    return this._fetch('/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
  },

  async registerAdmin(data) {
    return this._fetch('/register-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async forgotPasswordByUsername(username, newPassword) {
    return this._fetch('/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, newPassword })
    });
  },

  async checkUsername(username) {
    return this._fetch('/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
  },

  async registerUser(username, password, role, extra = {}) {
    return this._fetch('/register', {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({ username, password, role, ...extra })
    });
  },

  async forgotPassword(email) {
    return this._fetch('/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
  },

  async verifyOTP(email, otp, purpose = 'register') {
    return this._fetch('/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, purpose })
    });
  },

  async resetPassword(email, otp, newPassword) {
    return this._fetch('/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword })
    });
  },

  // ── Tickets ───────────────────────────────────────────────────────────
  async getTickets(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this._fetch(`/tickets${params ? '?' + params : ''}`, { headers: this._headers() });
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

  async addComment(ticketId, text) {
    return this._fetch(`/tickets/${ticketId}/comments`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({ text })
    });
  },

  async getComments(ticketId) {
    return this._fetch(`/tickets/${ticketId}/comments`, { headers: this._headers() });
  },

  async getTicketHistory(ticketId) {
    return this._fetch(`/tickets/${ticketId}/history`, { headers: this._headers() });
  },

  async assignTicketById(ticketId, staffId) {
    return this._fetch(`/tickets/${ticketId}/assign`, {
      method: 'PUT',
      headers: this._headers(),
      body: JSON.stringify({ staffId })
    });
  },

  async addCommentLegacy(ticketId, text) {
    return this._fetch(`/tickets/${ticketId}/comment`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({ text })
    });
  },

  async uploadProof(ticketId, formData) {
    // No Content-Type header – browser sets multipart boundary automatically
    return this._fetch(`/tickets/${ticketId}/proof`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.getToken()}` },
      body: formData
    });
  },

  // ── Statistics ────────────────────────────────────────────────────────
  async getStatistics() {
    return this._fetch('/stats', { headers: this._headers() });
  },

  // ── Admin ─────────────────────────────────────────────────────────────
  async getStaff() {
    return this._fetch('/admin/staff', { headers: this._headers() });
  },

  async getAvailableStaff(category = '') {
    return this._fetch(`/admin/staff/available${category ? '?category=' + category : ''}`,
      { headers: this._headers() });
  },

  async addStaff(data) {
    return this._fetch('/admin/staff', {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify(data)
    });
  },

  async updateStaff(staffId, data) {
    return this._fetch(`/admin/staff/${staffId}`, {
      method: 'PUT',
      headers: this._headers(),
      body: JSON.stringify(data)
    });
  },

  async getWorkload() {
    return this._fetch('/admin/workload', { headers: this._headers() });
  },

  async getHolidays() {
    return this._fetch('/admin/holidays', { headers: this._headers() });
  },

  async addHoliday(date, name, type = 'national') {
    return this._fetch('/admin/holidays', {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({ date, name, type })
    });
  },

  async deleteHoliday(holidayId) {
    return this._fetch(`/admin/holidays/${holidayId}`, {
      method: 'DELETE',
      headers: this._headers()
    });
  },

  async getUsers() {
    return this._fetch('/users', { headers: this._headers() });
  },

  async createUser(data) {
    return this._fetch('/users', {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify(data)
    });
  },

  async updateUserStatus(userId, isActive) {
    return this._fetch(`/users/${userId}/status`, {
      method: 'PUT',
      headers: this._headers(),
      body: JSON.stringify({ isActive })
    });
  },

  async resetUserPassword(userId, newPassword) {
    return this._fetch(`/users/${userId}/password`, {
      method: 'PUT',
      headers: this._headers(),
      body: JSON.stringify({ newPassword })
    });
  },

  async getStaffList() {
    return this._fetch('/staff', { headers: this._headers() });
  },

  async updateStaffAvailability(staffId, availability) {
    return this._fetch(`/staff/${staffId}/availability`, {
      method: 'PUT',
      headers: this._headers(),
      body: JSON.stringify({ availability })
    });
  },

  async getHolidaysPublic() {
    return this._fetch('/holidays', { headers: this._headers() });
  },

  async addHolidayPublic(date, name, type) {
    return this._fetch('/holidays', {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({ date, name, type })
    });
  },

  async updateHoliday(holidayId, data) {
    return this._fetch(`/holidays/${holidayId}`, {
      method: 'PUT',
      headers: this._headers(),
      body: JSON.stringify(data)
    });
  },

  async deleteHolidayPublic(holidayId) {
    return this._fetch(`/holidays/${holidayId}`, {
      method: 'DELETE',
      headers: this._headers()
    });
  },

  async getDashboardSummary() {
    return this._fetch('/dashboard/summary', { headers: this._headers() });
  },

  async getUsersLegacy() {
    return this._fetch('/admin/users', { headers: this._headers() });
  }
};

window.API = API;
