// routes/admin.js – Admin: staff management, holidays, workload, reports

const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const Ticket  = require('../models/Ticket');
const Holiday = require('../models/Holiday');
const { authenticateToken, requireRole } = require('../middleware/auth');

const adminOnly = [authenticateToken, requireRole('admin')];

// ── GET /api/admin/staff – List all staff with today's load ───────────────
router.get('/admin/staff', ...adminOnly, async (req, res) => {
  try {
    const staffList = await User.find({ role: 'staff' }).select('-password');

    const today    = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);

    const withLoad = await Promise.all(staffList.map(async s => {
      const todayCount = await Ticket.countDocuments({
        assignedTo: s._id,
        createdAt:  { $gte: today, $lt: tomorrow }
      });
      const totalOpen = await Ticket.countDocuments({
        assignedTo: s._id,
        status:     { $nin: ['Closed','Resolved','Completed'] }
      });
      return { ...s.toSafeObject(), todayCount, totalOpen };
    }));

    res.json({ success: true, staff: withLoad });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/staff/available – Staff available for a category ────────
router.get('/admin/staff/available', ...adminOnly, async (req, res) => {
  try {
    const { category } = req.query;
    const query = { role: 'staff', isActive: true };
    if (category) query.category = { $regex: new RegExp(`^${category}$`, 'i') };

    const staffList = await User.find(query).select('-password');

    const today    = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);

    const withLoad = await Promise.all(staffList.map(async s => {
      const todayCount = await Ticket.countDocuments({
        assignedTo: s._id, createdAt: { $gte: today, $lt: tomorrow }
      });
      const available = todayCount < s.maxTicketsPerDay;
      return { ...s.toSafeObject(), todayCount, available };
    }));

    res.json({ success: true, staff: withLoad });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/admin/staff – Add new staff ─────────────────────────────────
router.post('/admin/staff', ...adminOnly, async (req, res) => {
  try {
    const { username, name, email, password, phone, category, maxTicketsPerDay } = req.body;
    if (!username || !password)
      return res.status(400).json({ success: false, message: 'username and password required' });

    const exists = await User.findOne({
      $or: [{ username: username.toLowerCase() }, { email: (email||'').toLowerCase() }]
    });
    if (exists) return res.status(400).json({ success: false, message: 'Username or email already exists' });

    const staff = await User.create({
      name: name || username,
      username: username.toLowerCase(),
      email: (email || `${username}@carbochem.com`).toLowerCase(),
      password,
      phone: phone || '',
      role: 'staff',
      category: category || '',
      maxTicketsPerDay: maxTicketsPerDay || 5,
      isVerified: true,
    });

    res.status(201).json({ success: true, user: staff.toSafeObject(), message: 'Staff added successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/admin/staff/:id – Update staff ───────────────────────────────
router.put('/admin/staff/:id', ...adminOnly, async (req, res) => {
  try {
    const { name, email, phone, category, maxTicketsPerDay, isActive } = req.body;
    const staff = await User.findById(req.params.id);
    if (!staff || staff.role !== 'staff')
      return res.status(404).json({ success: false, message: 'Staff not found' });

    if (name  !== undefined) staff.name  = name;
    if (email !== undefined) staff.email = email.toLowerCase();
    if (phone !== undefined) staff.phone = phone;
    if (category !== undefined) staff.category = category;
    if (maxTicketsPerDay !== undefined) staff.maxTicketsPerDay = maxTicketsPerDay;
    if (isActive !== undefined) staff.isActive = isActive;

    await staff.save();
    res.json({ success: true, user: staff.toSafeObject(), message: 'Staff updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/workload – Staff workload summary ─────────────────────
router.get('/admin/workload', ...adminOnly, async (req, res) => {
  try {
    const pipeline = await Ticket.aggregate([
      { $match: { assignedTo: { $ne: null } } },
      { $group: { _id: '$assignedTo', count: { $sum: 1 },
          open:     { $sum: { $cond: [{ $eq: ['$status','Open'] }, 1, 0] } },
          progress: { $sum: { $cond: [{ $eq: ['$status','In Progress'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $in: ['$status',['Resolved','Closed','Completed']] }, 1, 0] } },
      }},
    ]);

    const enriched = await Promise.all(pipeline.map(async w => {
      const staff = await User.findById(w._id).select('name username category');
      return { staffId: w._id, staffName: staff?.name || staff?.username || 'Unknown',
               category: staff?.category || '', ...w };
    }));

    res.json({ success: true, workload: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/holidays – List holidays ───────────────────────────────
router.get('/admin/holidays', ...adminOnly, async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 });
    res.json({ success: true, holidays });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/admin/holidays – Add holiday ────────────────────────────────
router.post('/admin/holidays', ...adminOnly, async (req, res) => {
  try {
    const { date, name, type } = req.body;
    if (!date || !name) return res.status(400).json({ success: false, message: 'date and name required' });

    const holiday = await Holiday.create({ date: new Date(date), name, type: type || 'national' });
    res.status(201).json({ success: true, holiday, message: 'Holiday added' });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Holiday already exists for this date' });
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/admin/holidays/:id ────────────────────────────────────────
router.delete('/admin/holidays/:id', ...adminOnly, async (req, res) => {
  try {
    await Holiday.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Holiday removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/users – List all users ────────────────────────────────
router.get('/admin/users', ...adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, users: users.map(u => u.toSafeObject()) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
