const API = {
    // Base URL for API calls
    baseURL: '/api',

    // Get auth token from localStorage
    getToken() {
        return localStorage.getItem('token');
    },

    // FIXED: Removed 'role' parameter - backend doesn't need it
    async login(username, password) {
        try {
            const response = await fetch(`${this.baseURL}/auth`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            return await response.json();
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Login failed' };
        }
    },

    // Register new user
    async registerUser(username, password, role) {
        try {
            const response = await fetch(`${this.baseURL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify({ username, password, role })
            });
            return await response.json();
        } catch (error) {
            console.error('Register error:', error);
            return { success: false, message: 'Registration failed' };
        }
    },

    // Get all tickets
    async getTickets() {
        try {
            const response = await fetch(`${this.baseURL}/tickets`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Get tickets error:', error);
            return { success: false, message: 'Failed to fetch tickets' };
        }
    },

    // Get user's tickets only
    async getMyTickets() {
        try {
            const response = await fetch(`${this.baseURL}/mytickets`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Get my tickets error:', error);
            return { success: false, message: 'Failed to fetch tickets' };
        }
    },

    // Create new ticket
    async createTicket(title, description, priority = 'Medium', category = 'General', customerName = '', email = '', mobile = '') {
        try {
            const response = await fetch(`${this.baseURL}/tickets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify({
                    title,
                    description,
                    priority,
                    category,
                    customerName,
                    email,
                    mobile
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Create ticket error:', error);
            return { success: false, message: 'Failed to create ticket' };
        }
    },

    // Update ticket status
    async updateTicketStatus(ticketId, status) {
        try {
            const response = await fetch(`${this.baseURL}/tickets/${ticketId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify({ status })
            });
            return await response.json();
        } catch (error) {
            console.error('Update status error:', error);
            return { success: false, message: 'Failed to update status' };
        }
    },

    // Assign ticket to staff
    async assignTicket(ticketId, staffUsername) {
        try {
            const response = await fetch(`${this.baseURL}/tickets/${ticketId}/assign`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify({ staffUsername })
            });
            return await response.json();
        } catch (error) {
            console.error('Assign ticket error:', error);
            return { success: false, message: 'Failed to assign ticket' };
        }
    },

    // Get ticket by ID
    async getTicketById(ticketId) {
        try {
            const result = await this.getTickets();
            if (result.success) {
                const ticket = result.tickets.find(t => t.id.toString() === ticketId.toString());
                return { success: true, ticket };
            }
            return { success: false, message: 'Ticket not found' };
        } catch (error) {
            console.error('Get ticket by ID error:', error);
            return { success: false, message: 'Failed to fetch ticket' };
        }
    },

    // Get statistics
    async getStatistics() {
        try {
            const response = await fetch(`${this.baseURL}/stats`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Get stats error:', error);
            return { success: false, message: 'Failed to fetch statistics' };
        }
    }
};

// Make API available globally
window.API = API;