// mock_data.js - Mock backend data for testing (until C backend is compiled)

// In-memory data storage
let users = [
    { id: 1, username: 'admin', password: 'admin123', role: 'admin' },
    { id: 2, username: 'staff', password: 'staff123', role: 'staff' },
    { id: 3, username: 'client', password: 'client123', role: 'client' }
];

let tickets = [
    {
        id: 1,
        title: 'System Login Issue',
        description: 'Unable to login to the system',
        status: 'Open',
        priority: 'High',
        category: 'Technical',
        customerName: 'John Doe',
        email: 'john@example.com',
        mobile: '1234567890',
        assignedTo: null,
        createdBy: 'client',
        createdAt: new Date('2025-01-10').toISOString(),
        dueDate: new Date('2025-01-17').toISOString()
    },
    {
        id: 2,
        title: 'Product Quality Concern',
        description: 'Damaged packaging on delivery',
        status: 'In Progress',
        priority: 'Medium',
        category: 'Quality',
        customerName: 'Jane Smith',
        email: 'jane@example.com',
        mobile: '0987654321',
        assignedTo: 'staff',
        createdBy: 'client',
        createdAt: new Date('2025-01-12').toISOString(),
        dueDate: new Date('2025-01-19').toISOString()
    },
    {
        id: 3,
        title: 'Delivery Issue',
        description: 'Wrong items delivered',
        status: 'Resolved',
        priority: 'Low',
        category: 'Delivery',
        customerName: 'Bob Johnson',
        email: 'bob@example.com',
        mobile: '5551234567',
        assignedTo: 'staff',
        createdBy: 'client',
        createdAt: new Date('2025-01-08').toISOString(),
        dueDate: new Date('2025-01-15').toISOString()
    },
    {
        id: 4,
        title: 'Inspection Required',
        description: 'Need on-site inspection for installation',
        status: 'Open',
        priority: 'Critical',
        category: 'Inspection',
        customerName: 'Alice Brown',
        email: 'alice@example.com',
        mobile: '5559876543',
        assignedTo: null,
        createdBy: 'client',
        createdAt: new Date('2025-01-15').toISOString(),
        dueDate: new Date('2025-01-20').toISOString()
    }
];

let nextUserId = 4;
let nextTicketId = 5;

// Authenticate user
function authenticate(username, password) {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        return {
            success: true,
            userId: user.id,
            username: user.username,
            role: user.role
        };
    }
    return {
        success: false,
        message: 'Invalid credentials'
    };
}

// Register new user
function registerUser(username, password, role) {
    // Check if username already exists
    if (users.find(u => u.username === username)) {
        return {
            success: false,
            message: 'Username already exists'
        };
    }

    const newUser = {
        id: nextUserId++,
        username,
        password,
        role
    };

    users.push(newUser);

    return {
        success: true,
        user: {
            userId: newUser.id,
            username: newUser.username,
            role: newUser.role
        }
    };
}

// Get all tickets
function getTickets() {
    return {
        success: true,
        tickets: tickets
    };
}

// Get user's tickets
function getUserTickets(username) {
    const userTickets = tickets.filter(t => t.createdBy === username);
    return {
        success: true,
        tickets: userTickets
    };
}

// Get tickets assigned to staff
function getAssignedTickets(username) {
    const assignedTickets = tickets.filter(t => t.assignedTo === username);
    return {
        success: true,
        tickets: assignedTickets
    };
}

// Create new ticket
function createTicket(title, description, username, priority = 'Medium', category = 'General', customerName = '', email = '', mobile = '') {
    const newTicket = {
        id: nextTicketId++,
        title,
        description,
        status: 'Open',
        priority,
        category,
        customerName: customerName || username,
        email: email || '',
        mobile: mobile || '',
        assignedTo: null,
        createdBy: username,
        createdAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
    };

    tickets.push(newTicket);

    return {
        success: true,
        ticket: newTicket,
        message: 'Ticket created successfully'
    };
}

// Update ticket status
function updateTicketStatus(ticketId, status, username) {
    const ticket = tickets.find(t => t.id === ticketId);
    
    if (!ticket) {
        return {
            success: false,
            message: 'Ticket not found'
        };
    }

    ticket.status = status;

    return {
        success: true,
        ticket,
        message: 'Ticket status updated'
    };
}

// Assign ticket to staff
function assignTicket(ticketId, staffUsername) {
    const ticket = tickets.find(t => t.id === ticketId);
    
    if (!ticket) {
        return {
            success: false,
            message: 'Ticket not found'
        };
    }

    const staff = users.find(u => u.username === staffUsername && u.role === 'staff');
    
    if (!staff) {
        return {
            success: false,
            message: 'Staff member not found'
        };
    }

    ticket.assignedTo = staffUsername;
    if (ticket.status === 'Open') {
        ticket.status = 'In Progress';
    }

    return {
        success: true,
        ticket,
        message: 'Ticket assigned successfully'
    };
}

// Get ticket by ID
function getTicketById(ticketId) {
    const ticket = tickets.find(t => t.id === ticketId);
    
    if (ticket) {
        return {
            success: true,
            ticket
        };
    }

    return {
        success: false,
        message: 'Ticket not found'
    };
}

// Get statistics
function getStatistics() {
    const stats = {
        total: tickets.length,
        open: tickets.filter(t => t.status === 'Open').length,
        inProgress: tickets.filter(t => t.status === 'In Progress').length,
        resolved: tickets.filter(t => t.status === 'Resolved').length,
        critical: tickets.filter(t => t.priority === 'Critical').length,
        high: tickets.filter(t => t.priority === 'High').length,
        medium: tickets.filter(t => t.priority === 'Medium').length,
        low: tickets.filter(t => t.priority === 'Low').length
    };

    return {
        success: true,
        stats
    };
}

module.exports = {
    authenticate,
    registerUser,
    getTickets,
    getUserTickets,
    getAssignedTickets,
    createTicket,
    updateTicketStatus,
    assignTicket,
    getTicketById,
    getStatistics
};