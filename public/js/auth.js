// auth.js - Simple Authentication Handler

// Check if user is logged in
function isAuthenticated() {
    return !!localStorage.getItem('token');
}

// Get current user info
function getCurrentUser() {
    return {
        username: localStorage.getItem('username'),
        role: localStorage.getItem('userRole'),
        token: localStorage.getItem('token')
    };
}

// Check authentication and redirect if needed
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Check if user has required role
function requireRole(allowedRoles) {
    if (!requireAuth()) return false;
    
    const user = getCurrentUser();
    if (!allowedRoles.includes(user.role)) {
        alert('Access denied. Insufficient permissions.');
        window.location.href = 'index.html';
        return false;
    }
    
    return true;
}

// Logout function
function logout() {
    if (confirm("Are you sure you want to logout?")) {
        localStorage.clear();
        window.location.href = "index.html";
    }
}