const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mockData = require('./mock_data');

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// POST /api/auth - Login
router.post('/auth', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Credentials required' });
  }
  
  const result = mockData.authenticate(username, password);
  
  if (result.success) {
    const token = jwt.sign(
      { userId: result.userId, username: result.username, role: result.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      token,
      user: { userId: result.userId, username: result.username, role: result.role }
    });
  } else {
    res.status(401).json(result);
  }
});

// POST /api/register - Register new user (admin only)
router.post('/register', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }

  const { username, password, role } = req.body;
  
  if (!username || !password || !role) {
    return res.status(400).json({ success: false, message: 'All fields required' });
  }
  
  const result = mockData.registerUser(username, password, role);
  res.json(result);
});

// GET /api/tickets - Get all tickets
router.get('/tickets', authenticateToken, (req, res) => {
  const result = mockData.getTickets();
  res.json(result);
});

// POST /api/tickets - Create new ticket
router.post('/tickets', authenticateToken, (req, res) => {
  const { title, description, priority, category, customerName, email, mobile } = req.body;
  
  if (!title || !description) {
    return res.status(400).json({ success: false, message: 'Title and description required' });
  }
  
  const result = mockData.createTicket(
    title, 
    description, 
    req.user.username,
    priority,
    category,
    customerName,
    email,
    mobile
  );
  res.json(result);
});

// GET /api/mytickets - Get user's own tickets
router.get('/mytickets', authenticateToken, (req, res) => {
  const result = mockData.getUserTickets(req.user.username);
  res.json(result);
});

// GET /api/assigned - Get tickets assigned to staff
router.get('/assigned', authenticateToken, (req, res) => {
  if (req.user.role !== 'staff') {
    return res.status(403).json({ success: false, message: 'Staff access required' });
  }
  
  const result = mockData.getAssignedTickets(req.user.username);
  res.json(result);
});

// GET /api/tickets/:id - Get specific ticket
router.get('/tickets/:id', authenticateToken, (req, res) => {
  const ticketId = parseInt(req.params.id);
  const result = mockData.getTicketById(ticketId);
  
  if (result.success) {
    res.json(result);
  } else {
    res.status(404).json(result);
  }
});

// PUT /api/tickets/:id/status - Update ticket status
router.put('/tickets/:id/status', authenticateToken, (req, res) => {
  const ticketId = parseInt(req.params.id);
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({ success: false, message: 'Status required' });
  }
  
  const result = mockData.updateTicketStatus(ticketId, status, req.user.username);
  res.json(result);
});

// PUT /api/tickets/:id/assign - Assign ticket to staff
router.put('/tickets/:id/assign', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }

  const ticketId = parseInt(req.params.id);
  const { staffUsername } = req.body;
  
  if (!staffUsername) {
    return res.status(400).json({ success: false, message: 'Staff username required' });
  }
  
  const result = mockData.assignTicket(ticketId, staffUsername);
  res.json(result);
});

// GET /api/stats - Get statistics (admin only)
router.get('/stats', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }

  const result = mockData.getStatistics();
  res.json(result);
});

module.exports = router;