// routes/features.js – Extended API routes (users, staff, holidays, ticket history/comments)

const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const Ticket  = require('../models/Ticket');
const Holiday = require('../models/Holiday');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { addTicketHistory } = require('../services/ticketHistory');

const adminOnly = [authenticateToken, requireRole('admin')];

function formatTicket(t) {
  const obj = t.toObject ? t.toObject() : t;
  return {
    ...obj,
    id:         obj._id ? obj._id.toString().slice(-6) : obj.id,
    _id:        obj._id,
    assignedTo: obj.assignedToName || null,
    createdBy:  obj.createdByName  || obj.createdBy,
    createdAt:  obj.createdAt,
    updatedAt:  obj.updatedAt,
    assignedAt: obj.assignedAt,
    dueDate:    obj.dueDate,
  };
}

// ── POST /api/users – Admin creates staff or consumer ─────────────────────
router.post('/users', ...adminOnly, async (req, res) => {
  try {
    const { username, name, email, password, phone, role, department, category } = req.body;
    if (!username || !password || !role)
      return res.status(400).json({ success: false, message: 'username, password, role required' });
    if (!['staff', 'client'].includes(role))
      return res.status(400).json({ success: false, message: 'Role must be staff or client' });

    const exists = await User.findOne({
      $or: [{ username: username.toLowerCase() }, { email: (email || '').toLowerCase() }]
    });
    if (exists)
      return res.status(400).json({ success: false, message: 'Username or email already exists' });

    const user = await User.create({
      name: name || username,
      username: username.toLowerCase(),
      email: (email || `${username}@carbochem.com`).toLowerCase(),
      password,
      phone: phone || '',
      department: department || '',
      role,
      category: category || '',
      availability: role === 'staff' ? 'available' : undefined,
      isVerified: true,
    });

    res.status(201).json({ success: true, user: user.toSafeObject(), message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/users – All users (admin) ────────────────────────────────────
router.get('/users', ...adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, users: users.map(u => u.toSafeObject()) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/users/:id/status – Activate/deactivate user ────────────────────
router.put('/users/:id/status', ...adminOnly, async (req, res) => {
  try {
    const { isActive } = req.body;
    if (isActive === undefined)
      return res.status(400).json({ success: false, message: 'isActive required' });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isActive = isActive;
    await user.save();
    res.json({ success: true, user: user.toSafeObject(), message: isActive ? 'User activated' : 'User deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/users/:id/password – Admin resets password ─────────────────────
router.put('/users/:id/password', ...adminOnly, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/staff – All staff with ticket counts ───────────────────────────
router.get('/staff', authenticateToken, async (req, res) => {
  try {
    const staffList = await User.find({ role: 'staff' }).select('-password');
    const withStats = await Promise.all(staffList.map(async s => {
      const assignedCount = await Ticket.countDocuments({
        assignedTo: s._id,
        status: { $nin: ['Closed', 'Resolved', 'Completed'] }
      });
      return { ...s.toSafeObject(), assignedCount };
    }));
    res.json({ success: true, staff: withStats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/staff/:id/availability – Update staff availability ─────────────
router.put('/staff/:id/availability', authenticateToken, async (req, res) => {
  try {
    const { availability } = req.body;
    const valid = ['available', 'on_leave', 'busy'];
    if (!valid.includes(availability))
      return res.status(400).json({ success: false, message: 'Invalid availability status' });

    const staff = await User.findById(req.params.id);
    if (!staff || staff.role !== 'staff')
      return res.status(404).json({ success: false, message: 'Staff not found' });

    if (req.user.role === 'staff' && req.user.userId !== staff._id.toString())
      return res.status(403).json({ success: false, message: 'Can only update your own availability' });
    if (req.user.role === 'client')
      return res.status(403).json({ success: false, message: 'Access denied' });

    staff.availability = availability;
    await staff.save();
    res.json({ success: true, user: staff.toSafeObject(), message: 'Availability updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/holidays – List holidays (authenticated) ───────────────────────
router.get('/holidays', authenticateToken, async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 });
    res.json({ success: true, holidays });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/holidays – Add holiday (admin) ────────────────────────────────
router.post('/holidays', ...adminOnly, async (req, res) => {
  try {
    const { date, name, type } = req.body;
    if (!date || !name)
      return res.status(400).json({ success: false, message: 'date and name required' });

    const holiday = await Holiday.create({ date: new Date(date), name, type: type || 'Public Holiday' });
    res.status(201).json({ success: true, holiday, message: 'Holiday added' });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ success: false, message: 'Holiday already exists for this date' });
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/holidays/:id – Edit holiday (admin) ────────────────────────────
router.put('/holidays/:id', ...adminOnly, async (req, res) => {
  try {
    const { date, name, type } = req.body;
    const holiday = await Holiday.findById(req.params.id);
    if (!holiday) return res.status(404).json({ success: false, message: 'Holiday not found' });

    if (date) holiday.date = new Date(date);
    if (name) holiday.name = name;
    if (type) holiday.type = type;
    await holiday.save();
    res.json({ success: true, holiday, message: 'Holiday updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/holidays/:id – Delete holiday (admin) ───────────────────────
router.delete('/holidays/:id', ...adminOnly, async (req, res) => {
  try {
    await Holiday.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Holiday deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/tickets/:id/history – Ticket audit trail ───────────────────────
router.get('/tickets/:id/history', authenticateToken, async (req, res) => {
  try {
    let ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      const all = await Ticket.find();
      ticket = all.find(t => t._id.toString().slice(-6) === req.params.id);
    }
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    res.json({ success: true, history: ticket.history || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/tickets/:id/comments – Get comments ────────────────────────────
router.get('/tickets/:id/comments', authenticateToken, async (req, res) => {
  try {
    let ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      const all = await Ticket.find();
      ticket = all.find(t => t._id.toString().slice(-6) === req.params.id);
    }
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    res.json({ success: true, comments: ticket.comments || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/tickets/:id/comments – Add comment ────────────────────────────
router.post('/tickets/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Comment text required' });

    let ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      const all = await Ticket.find();
      ticket = all.find(t => t._id.toString().slice(-6) === req.params.id);
    }
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    const user = await User.findById(req.user.userId);
    ticket.comments.push({
      author: req.user.userId,
      authorName: user?.name || req.user.username,
      text,
    });
    await addTicketHistory(ticket, {
      action: 'comment_added',
      userId: req.user.userId,
      userName: user?.name || req.user.username,
      field: 'comment',
      newValue: text.slice(0, 100),
    });
    await ticket.save();

    res.json({ success: true, ticket: formatTicket(ticket), message: 'Comment added' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/dashboard/summary – Admin dashboard stats ──────────────────────
router.get('/dashboard/summary', ...adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'client' });
    const totalStaff = await User.countDocuments({ role: 'staff', isActive: true });
    const openTickets = await Ticket.countDocuments({ status: 'Open' });
    const unassignedTickets = await Ticket.countDocuments({
      assignedTo: null,
      status: { $nin: ['Closed', 'Resolved', 'Completed'] }
    });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const holidaysThisMonth = await Holiday.countDocuments({
      date: { $gte: monthStart, $lte: monthEnd }
    });

    res.json({
      success: true,
      summary: { totalUsers, totalStaff, openTickets, unassignedTickets, holidaysThisMonth }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
