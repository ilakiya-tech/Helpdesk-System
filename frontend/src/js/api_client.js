// api.js - Frontend API Client
// Place this in: frontend/public/js/api.js

const API_BASE_URL = 'http://localhost:3000/api';

// Helper function to get JWT token
function getToken() {
    return localStorage.getItem('jwt_token');
}

// Helper function to set JWT token
function setToken(token) {
    localStorage.setItem('jwt_token', token);
}

// Helper function to remove JWT token
function removeToken() {
    localStorage.removeItem('jwt_token');
}

// Helper function to get user info
function getUser() {
    const userStr = localStorage.getItem('user_info');
    return userStr ? JSON.parse(userStr) : null;
}

// Helper function to set user info
function setUser(user) {
    localStorage.setItem('user_info', JSON.stringify(user));
}

// Helper function to remove user info
function removeUser() {
    localStorage.removeItem('user_info');
}

// API wrapper with authentication
async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
        ...options,
        headers
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Authentication API
const authAPI = {
    login: async (username, password, role) => {
        try {
            const response = await apiRequest('/auth', {
                method: 'POST',
                body: JSON.stringify({ username, password, role })
            });
            
            if (response.success && response.token) {
                setToken(response.token);
                setUser(response.user);
                return response;
            }
            
            throw new Error(response.message || 'Login failed');
        } catch (error) {
            throw error;
        }
    },
    
    logout: () => {
        removeToken();
        removeUser();
    },
    
    isAuthenticated: () => {
        return !!getToken();
    },
    
    getCurrentUser: () => {
        return getUser();
    }
};

// User API (Admin only)
const userAPI = {
    getAll: async () => {
        return await apiRequest('/users', { method: 'GET' });
    },
    
    register: async (username, password, role) => {
        return await apiRequest('/users', {
            method: 'POST',
            body: JSON.stringify({ username, password, role })
        });
    }
};

// Ticket API
const ticketAPI = {
    getAll: async () => {
        return await apiRequest('/tickets', { method: 'GET' });
    },
    
    getMyTickets: async () => {
        return await apiRequest('/mytickets', { method: 'GET' });
    },
    
    create: async (title, description) => {
        return await apiRequest('/tickets', {
            method: 'POST',
            body: JSON.stringify({ title, description })
        });
    },
    
    updateStatus: async (ticketId, status) => {
        return await apiRequest(`/tickets/${ticketId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    },
    
    assign: async (ticketId, staffUsername) => {
        return await apiRequest(`/tickets/${ticketId}/assign`, {
            method: 'PUT',
            body: JSON.stringify({ staffUsername })
        });
    }
};

// Export API object
const API = {
    auth: authAPI,
    users: userAPI,
    tickets: ticketAPI
};

// Make it available globally
if (typeof window !== 'undefined') {
    window.API = API;
}
