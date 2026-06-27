// mock_data.js - Mock backend data for testing (until C backend is compiled)

let users = [
    { id: 1, username: 'admin', password: 'admin123', role: 'admin', name: 'Admin User', email: 'admin@carbochem.com', phone: '9876500001', department: 'Administration', availability: 'available', isActive: true },
    { id: 2, username: 'staff', password: 'staff123', role: 'staff', name: 'Field Staff', email: 'staff@carbochem.com', phone: '9876500002', department: 'Quality', category: 'Quality', availability: 'available', isActive: true },
    { id: 3, username: 'client', password: 'client123', role: 'client', name: 'John Doe', email: 'client@carbochem.com', phone: '9876500003', department: 'Consumer', availability: 'available', isActive: true },
    { id: 4, username: 'ravi', password: 'staff123', role: 'staff', name: 'Ravi Kumar', email: 'ravi@carbochem.com', phone: '9876500004', department: 'Network', category: 'Network', availability: 'available', isActive: true },
    { id: 5, username: 'priya', password: 'staff123', role: 'staff', name: 'Priya Singh', email: 'priya@carbochem.com', phone: '9876500005', department: 'Hardware', category: 'Hardware', availability: 'busy', isActive: true },
    { id: 6, username: 'jane', password: 'client123', role: 'client', name: 'Jane Smith', email: 'jane@carbochem.com', phone: '9876500006', department: 'Consumer', availability: 'available', isActive: true }
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
        assignedToName: null,
        createdBy: 'client',
        createdByName: 'John Doe',
        createdAt: new Date('2025-01-10').toISOString(),
        assignedAt: null,
        updatedAt: new Date('2025-01-10').toISOString(),
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
        assignedToName: 'Field Staff',
        createdBy: 'client',
        createdByName: 'Jane Smith',
        createdAt: new Date('2025-01-12').toISOString(),
        assignedAt: new Date('2025-01-12').toISOString(),
        updatedAt: new Date('2025-01-13').toISOString(),
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
        assignedToName: 'Field Staff',
        createdBy: 'client',
        createdByName: 'Bob Johnson',
        createdAt: new Date('2025-01-08').toISOString(),
        assignedAt: new Date('2025-01-09').toISOString(),
        updatedAt: new Date('2025-01-14').toISOString(),
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
        assignedToName: null,
        createdBy: 'client',
        createdByName: 'Alice Brown',
        createdAt: new Date('2025-01-15').toISOString(),
        assignedAt: null,
        updatedAt: new Date('2025-01-15').toISOString(),
        dueDate: new Date('2025-01-20').toISOString()
    },
    {
        id: 5,
        title: 'Network Connectivity Problem',
        description: 'Intermittent WiFi drops in warehouse area',
        status: 'In Progress',
        priority: 'High',
        category: 'Network',
        customerName: 'Jane Smith',
        email: 'jane@example.com',
        mobile: '0987654321',
        assignedTo: 'ravi',
        assignedToName: 'Ravi Kumar',
        createdBy: 'jane',
        createdByName: 'Jane Smith',
        createdAt: new Date('2025-01-18').toISOString(),
        assignedAt: new Date('2025-01-18').toISOString(),
        updatedAt: new Date('2025-01-19').toISOString(),
        dueDate: new Date('2025-01-21').toISOString()
    },
    {
        id: 6,
        title: 'Hardware Replacement Request',
        description: 'Barcode scanner needs replacement',
        status: 'Closed',
        priority: 'Medium',
        category: 'Hardware',
        customerName: 'John Doe',
        email: 'client@carbochem.com',
        mobile: '9876500003',
        assignedTo: 'priya',
        assignedToName: 'Priya Singh',
        createdBy: 'client',
        createdByName: 'John Doe',
        createdAt: new Date('2025-01-05').toISOString(),
        assignedAt: new Date('2025-01-06').toISOString(),
        updatedAt: new Date('2025-01-10').toISOString(),
        dueDate: new Date('2025-01-12').toISOString()
    }
];

let holidays = [
    { id: 1, name: 'Republic Day', date: '2025-01-26', type: 'Public Holiday' },
    { id: 2, name: 'Holi', date: '2025-03-14', type: 'Public Holiday' },
    { id: 3, name: 'Company Foundation Day', date: '2025-04-15', type: 'Company Holiday' },
    { id: 4, name: 'Independence Day', date: '2025-08-15', type: 'Public Holiday' },
    { id: 5, name: 'Annual Maintenance Shutdown', date: '2025-12-24', type: 'Company Holiday' },
    { id: 6, name: 'Christmas', date: '2025-12-25', type: 'Public Holiday' }
];

let ticketComments = [
    { id: 1, ticketId: 2, authorName: 'Field Staff', text: 'Inspecting the damaged packages at warehouse.', createdAt: new Date('2025-01-13').toISOString() },
    { id: 2, ticketId: 2, authorName: 'Jane Smith', text: 'Please prioritize - affecting production line.', createdAt: new Date('2025-01-13T14:00:00').toISOString() },
    { id: 3, ticketId: 5, authorName: 'Ravi Kumar', text: 'Router firmware updated, monitoring connectivity.', createdAt: new Date('2025-01-19').toISOString() }
];

let ticketHistory = [
    { id: 1, ticketId: 1, action: 'created', changedByName: 'John Doe', field: 'status', newValue: 'Open', createdAt: new Date('2025-01-10').toISOString() },
    { id: 2, ticketId: 2, action: 'created', changedByName: 'Jane Smith', field: 'status', newValue: 'Open', createdAt: new Date('2025-01-12').toISOString() },
    { id: 3, ticketId: 2, action: 'assigned', changedByName: 'Admin User', field: 'assignedTo', oldValue: 'Unassigned', newValue: 'Field Staff', createdAt: new Date('2025-01-12T10:00:00').toISOString() },
    { id: 4, ticketId: 2, action: 'status_changed', changedByName: 'Field Staff', field: 'status', oldValue: 'Open', newValue: 'In Progress', createdAt: new Date('2025-01-13').toISOString() },
    { id: 5, ticketId: 5, action: 'assigned', changedByName: 'Admin User', field: 'assignedTo', oldValue: 'Unassigned', newValue: 'Ravi Kumar', createdAt: new Date('2025-01-18').toISOString() }
];

let nextUserId = 7;
let nextTicketId = 7;
let nextHolidayId = 7;
let nextCommentId = 4;
let nextHistoryId = 6;

const ADMIN_SECRET = 'CARBOCHEM2024';

function authenticate(username, password) {
    const user = users.find(u => u.username === username && u.password === password && u.isActive !== false);
    if (user) {
        return { success: true, userId: user.id, username: user.username, role: user.role, name: user.name };
    }
    return { success: false, message: 'Invalid credentials' };
}

function registerAdmin(name, username, email, password, secretKey) {
    if (secretKey !== ADMIN_SECRET) return { success: false, message: 'Invalid secret key' };
    if (users.find(u => u.username === username)) return { success: false, message: 'Username already exists' };
    const newUser = { id: nextUserId++, username, password, role: 'admin', name, email: email || `${username}@carbochem.com`, phone: '', department: 'Administration', availability: 'available', isActive: true };
    users.push(newUser);
    return { success: true, user: { userId: newUser.id, username: newUser.username, role: newUser.role, name: newUser.name } };
}

function forgotPassword(username, newPassword) {
    const user = users.find(u => u.username === username);
    if (!user) return { success: false, message: 'Username not found' };
    if (!newPassword) return { success: true, found: true, message: 'User found' };
    user.password = newPassword;
    return { success: true, message: 'Password reset successfully' };
}

function registerUser(username, password, role, extra = {}) {
    if (users.find(u => u.username === username)) return { success: false, message: 'Username already exists' };
    const newUser = {
        id: nextUserId++, username, password, role,
        name: extra.name || username,
        email: extra.email || `${username}@carbochem.com`,
        phone: extra.phone || '',
        department: extra.department || '',
        category: extra.category || '',
        availability: role === 'staff' ? (extra.availability || 'available') : 'available',
        isActive: true
    };
    users.push(newUser);
    return { success: true, user: { userId: newUser.id, username: newUser.username, role: newUser.role, name: newUser.name } };
}

function getAllUsers() {
    return { success: true, users: users.map(({ password, ...u }) => u) };
}

function updateUserStatus(userId, isActive) {
    const user = users.find(u => u.id === parseInt(userId));
    if (!user) return { success: false, message: 'User not found' };
    user.isActive = isActive;
    return { success: true, user: { ...user, password: undefined } };
}

function resetUserPassword(userId, newPassword) {
    const user = users.find(u => u.id === parseInt(userId));
    if (!user) return { success: false, message: 'User not found' };
    user.password = newPassword;
    return { success: true, message: 'Password reset successfully' };
}

function getStaff() {
    const staff = users.filter(u => u.role === 'staff').map(s => {
        const assignedCount = tickets.filter(t => t.assignedTo === s.username && !['Closed', 'Resolved'].includes(t.status)).length;
        const { password, ...safe } = s;
        return { ...safe, assignedCount };
    });
    return { success: true, staff };
}

function updateStaffAvailability(staffId, availability) {
    const user = users.find(u => u.id === parseInt(staffId) && u.role === 'staff');
    if (!user) return { success: false, message: 'Staff not found' };
    user.availability = availability;
    return { success: true, user: { ...user, password: undefined } };
}

function getHolidays() {
    return { success: true, holidays };
}

function addHoliday(name, date, type) {
    const holiday = { id: nextHolidayId++, name, date, type: type || 'Public Holiday' };
    holidays.push(holiday);
    return { success: true, holiday };
}

function updateHoliday(id, data) {
    const h = holidays.find(x => x.id === parseInt(id));
    if (!h) return { success: false, message: 'Holiday not found' };
    if (data.name) h.name = data.name;
    if (data.date) h.date = data.date;
    if (data.type) h.type = data.type;
    return { success: true, holiday: h };
}

function deleteHoliday(id) {
    const idx = holidays.findIndex(x => x.id === parseInt(id));
    if (idx === -1) return { success: false, message: 'Holiday not found' };
    holidays.splice(idx, 1);
    return { success: true, message: 'Holiday deleted' };
}

function getTicketHistory(ticketId) {
    const tid = parseInt(ticketId);
    return { success: true, history: ticketHistory.filter(h => h.ticketId === tid) };
}

function getTicketComments(ticketId) {
    const tid = parseInt(ticketId);
    return { success: true, comments: ticketComments.filter(c => c.ticketId === tid) };
}

function addTicketComment(ticketId, authorName, text) {
    const comment = { id: nextCommentId++, ticketId: parseInt(ticketId), authorName, text, createdAt: new Date().toISOString() };
    ticketComments.push(comment);
    ticketHistory.push({ id: nextHistoryId++, ticketId: parseInt(ticketId), action: 'comment_added', changedByName: authorName, field: 'comment', newValue: text.slice(0, 100), createdAt: comment.createdAt });
    return { success: true, comment };
}

function getTickets() {
    return { success: true, tickets };
}

function getUserTickets(username) {
    return { success: true, tickets: tickets.filter(t => t.createdBy === username) };
}

function getAssignedTickets(username) {
    return { success: true, tickets: tickets.filter(t => t.assignedTo === username) };
}

function createTicket(title, description, username, priority = 'Medium', category = 'General', customerName = '', email = '', mobile = '') {
    const user = users.find(u => u.username === username);
    const now = new Date().toISOString();
    const newTicket = {
        id: nextTicketId++,
        title, description,
        status: 'Open', priority, category,
        customerName: customerName || username,
        email: email || '', mobile: mobile || '',
        assignedTo: null, assignedToName: null,
        createdBy: username,
        createdByName: user?.name || username,
        createdAt: now, assignedAt: null, updatedAt: now,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    tickets.push(newTicket);
    ticketHistory.push({ id: nextHistoryId++, ticketId: newTicket.id, action: 'created', changedByName: user?.name || username, field: 'status', newValue: 'Open', createdAt: now });
    return { success: true, ticket: newTicket, message: 'Ticket created successfully' };
}

function updateTicketStatus(ticketId, status, username) {
    const ticket = tickets.find(t => t.id === parseInt(ticketId));
    if (!ticket) return { success: false, message: 'Ticket not found' };
    const oldStatus = ticket.status;
    ticket.status = status;
    ticket.updatedAt = new Date().toISOString();
    const user = users.find(u => u.username === username);
    ticketHistory.push({ id: nextHistoryId++, ticketId: ticket.id, action: 'status_changed', changedByName: user?.name || username, field: 'status', oldValue: oldStatus, newValue: status, createdAt: ticket.updatedAt });
    return { success: true, ticket, message: 'Ticket status updated' };
}

function assignTicket(ticketId, staffUsername, adminName = 'Admin') {
    const ticket = tickets.find(t => t.id === parseInt(ticketId));
    if (!ticket) return { success: false, message: 'Ticket not found' };
    const staff = users.find(u => u.username === staffUsername && u.role === 'staff');
    if (!staff) return { success: false, message: 'Staff member not found' };
    const oldAssignee = ticket.assignedToName || 'Unassigned';
    ticket.assignedTo = staffUsername;
    ticket.assignedToName = staff.name || staffUsername;
    ticket.assignedAt = new Date().toISOString();
    ticket.updatedAt = ticket.assignedAt;
    if (ticket.status === 'Open') ticket.status = 'In Progress';
    ticketHistory.push({ id: nextHistoryId++, ticketId: ticket.id, action: 'assigned', changedByName: adminName, field: 'assignedTo', oldValue: oldAssignee, newValue: ticket.assignedToName, createdAt: ticket.assignedAt });
    return { success: true, ticket, message: 'Ticket assigned successfully' };
}

function getTicketById(ticketId) {
    const ticket = tickets.find(t => t.id === parseInt(ticketId));
    if (ticket) return { success: true, ticket };
    return { success: false, message: 'Ticket not found' };
}

function getStatistics() {
    const stats = {
        total: tickets.length,
        open: tickets.filter(t => t.status === 'Open').length,
        inProgress: tickets.filter(t => t.status === 'In Progress').length,
        resolved: tickets.filter(t => t.status === 'Resolved').length,
        unassigned: tickets.filter(t => !t.assignedTo && t.status === 'Open').length,
        critical: tickets.filter(t => t.priority === 'Critical').length,
        high: tickets.filter(t => t.priority === 'High').length,
        medium: tickets.filter(t => t.priority === 'Medium').length,
        low: tickets.filter(t => t.priority === 'Low').length,
        totalUsers: users.filter(u => u.role === 'client').length,
        totalStaff: users.filter(u => u.role === 'staff').length
    };
    return { success: true, stats };
}

module.exports = {
    authenticate, registerAdmin, forgotPassword, registerUser,
    getAllUsers, updateUserStatus, resetUserPassword,
    getStaff, updateStaffAvailability,
    getHolidays, addHoliday, updateHoliday, deleteHoliday,
    getTicketHistory, getTicketComments, addTicketComment,
    getTickets, getUserTickets, getAssignedTickets,
    createTicket, updateTicketStatus, assignTicket, getTicketById, getStatistics,
    users, tickets, holidays, ticketComments, ticketHistory
};
