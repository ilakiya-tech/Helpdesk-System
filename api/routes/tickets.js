// routes/tickets.js – Ticket CRUD, auto-assign, comments, photo upload

const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const Ticket  = require('../models/Ticket');
const User    = require('../models/User');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { autoAssign } = require('../services/autoAssign');
const { addTicketHistory } = require('../services/ticketHistory');

// ── Multer setup (photo proofs) ────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s/g,'_')}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5 MB

// ── Helper: format ticket for API response ─────────────────────────────────
function formatTicket(t) {
  const obj = t.toObject ? t.toObject() : t;
  return {
    ...obj,
    id:           obj._id.toString().slice(-6),
    _id:          obj._id,
    assignedTo:   obj.assignedToName || null,
    createdBy:    obj.createdByName  || obj.createdBy,
    createdAt:    obj.createdAt,
    updatedAt:    obj.updatedAt,
    assignedAt:   obj.assignedAt,
    dueDate:      obj.dueDate,
  };
}

// ── GET /api/tickets – All tickets (admin) or own (staff/client) ───────────
router.get('/tickets', authenticateToken, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'client') {
      // clients see their own tickets
      query = { createdBy: req.user.userId };
    } else if (req.user.role === 'staff') {
      query = { assignedTo: req.user.userId };
    }

    // Optional filters
    const { status, priority, category, staffId } = req.query;
    if (status)   query.status   = status;
    if (priority) query.priority = priority;
    if (category) query.category = { $regex: new RegExp(category, 'i') };
    if (staffId)  query.assignedTo = staffId;

    const tickets = await Ticket.find(query).sort({ createdAt: -1 });
    res.json({ success: true, tickets: tickets.map(formatTicket) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/mytickets – Tickets created by logged-in client ───────────────
router.get('/mytickets', authenticateToken, async (req, res) => {
  try {
    const tickets = await Ticket.find({ createdBy: req.user.userId }).sort({ createdAt: -1 });
    res.json({ success: true, tickets: tickets.map(formatTicket) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/assigned – Tickets assigned to logged-in staff ───────────────
router.get('/assigned', authenticateToken, async (req, res) => {
  try {
    const tickets = await Ticket.find({ assignedTo: req.user.userId }).sort({ createdAt: -1 });
    res.json({ success: true, tickets: tickets.map(formatTicket) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/tickets/:id ──────────────────────────────────────────────────
router.get('/tickets/:id', authenticateToken, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    res.json({ success: true, ticket: formatTicket(ticket) });
  } catch (err) {
    // Try short ID match
    try {
      const tickets = await Ticket.find();
      const t = tickets.find(t => t._id.toString().slice(-6) === req.params.id);
      if (!t) return res.status(404).json({ success: false, message: 'Ticket not found' });
      res.json({ success: true, ticket: formatTicket(t) });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  }
});

// ── POST /api/tickets – Create ticket + auto-assign ───────────────────────
router.post('/tickets', authenticateToken, upload.single('attachment'), async (req, res) => {
  try {
    const { title, description, priority, category, customerName, email, mobile } = req.body;
    if (!title || !description)
      return res.status(400).json({ success: false, message: 'Title and description required' });

    const creator = await User.findById(req.user.userId);
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const ticketData = {
      title,
      description,
      priority:     priority  || 'Medium',
      category:     category  || 'General',
      customerName: customerName || creator?.name || req.user.username,
      email:        email    || creator?.email || '',
      mobile:       mobile   || '',
      createdBy:    req.user.userId,
      createdByName:creator?.name || req.user.username,
      status:       'Open',
      dueDate,
      attachment:   req.file ? `/uploads/${req.file.filename}` : '',
    };

    // Auto-assignment only when explicitly enabled
    if (process.env.AUTO_ASSIGN === 'true') {
      const assignedStaff = await autoAssign({ category: ticketData.category });
      if (assignedStaff) {
        ticketData.assignedTo     = assignedStaff._id;
        ticketData.assignedToName = assignedStaff.name || assignedStaff.username;
        ticketData.status         = 'In Progress';
        ticketData.autoAssigned   = true;
        ticketData.assignedAt     = new Date();
      }
    }

    const ticket = await Ticket.create({
      ...ticketData,
      history: [{
        action: 'created',
        changedBy: req.user.userId,
        changedByName: creator?.name || req.user.username,
        field: 'status',
        newValue: 'Open',
      }]
    });

    const assignedStaff = ticket.assignedTo ? { name: ticket.assignedToName } : null;

    res.json({
      success: true,
      ticket:  formatTicket(ticket),
      message: assignedStaff
        ? `Ticket created and auto-assigned to ${ticketData.assignedToName}`
        : 'Ticket created. No staff available for auto-assignment.'
    });
  } catch (err) {
    console.error('[create ticket]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/tickets/:id/status – Update status ───────────────────────────
router.put('/tickets/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'Status required' });

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    const user = await User.findById(req.user.userId);
    const oldStatus = ticket.status;
    ticket.status = status;
    if (status === 'Resolved' || status === 'Closed') ticket.resolvedAt = new Date();

    await addTicketHistory(ticket, {
      action: 'status_changed',
      userId: req.user.userId,
      userName: user?.name || req.user.username,
      field: 'status',
      oldValue: oldStatus,
      newValue: status,
    });
    await ticket.save();

    res.json({ success: true, ticket: formatTicket(ticket), message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/tickets/:id/assign – Assign to staff (admin) ────────────────
router.put('/tickets/:id/assign', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { staffUsername, staffId } = req.body;

    let staff;
    if (staffId) {
      staff = await User.findById(staffId);
    } else if (staffUsername) {
      staff = await User.findOne({ username: staffUsername.toLowerCase() });
    }

    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    // Check availability
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);

    const todayCount = await Ticket.countDocuments({
      assignedTo: staff._id,
      createdAt: { $gte: today, $lt: tomorrow },
      status: { $nin: ['Closed','Resolved'] }
    });

    if (todayCount >= staff.maxTicketsPerDay) {
      return res.status(400).json({
        success: false,
        message: `${staff.name || staff.username} has reached their daily ticket limit (${staff.maxTicketsPerDay})`
      });
    }

    const oldAssignee = ticket.assignedToName || 'Unassigned';
    ticket.assignedTo     = staff._id;
    ticket.assignedToName = staff.name || staff.username;
    ticket.assignedAt     = new Date();
    if (ticket.status === 'Open') ticket.status = 'In Progress';

    const admin = await User.findById(req.user.userId);
    await addTicketHistory(ticket, {
      action: 'assigned',
      userId: req.user.userId,
      userName: admin?.name || req.user.username,
      field: 'assignedTo',
      oldValue: oldAssignee,
      newValue: ticket.assignedToName,
    });
    await ticket.save();

    res.json({ success: true, ticket: formatTicket(ticket), message: `Ticket assigned to ${ticket.assignedToName}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/tickets/:id/comment – Add comment ───────────────────────────
router.post('/tickets/:id/comment', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Comment text required' });

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    const user = await User.findById(req.user.userId);
    ticket.comments.push({
      author:     req.user.userId,
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

// ── POST /api/tickets/:id/proof – Upload photo proof (staff) ─────────────
router.post('/tickets/:id/proof', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Photo required' });

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    ticket.photoProof = `/uploads/${req.file.filename}`;
    await ticket.save();

    res.json({ success: true, ticket: formatTicket(ticket), message: 'Photo proof uploaded' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/stats – Statistics (admin) ───────────────────────────────────
router.get('/stats', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const [total, open, inProgress, resolved] = await Promise.all([
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: 'Open' }),
      Ticket.countDocuments({ status: 'In Progress' }),
      Ticket.countDocuments({ status: { $in: ['Resolved','Closed','Completed'] } }),
    ]);
    const [critical, high, medium, low] = await Promise.all([
      Ticket.countDocuments({ priority: 'Critical' }),
      Ticket.countDocuments({ priority: 'High' }),
      Ticket.countDocuments({ priority: 'Medium' }),
      Ticket.countDocuments({ priority: 'Low' }),
    ]);

    // Category breakdown
    const catPipeline = await Ticket.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const byCategory = {};
    catPipeline.forEach(c => { byCategory[c._id] = c.count; });

    res.json({
      success: true,
      stats: { total, open, inProgress, resolved, critical, high, medium, low, byCategory }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
