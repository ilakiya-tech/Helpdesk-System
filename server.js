require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Check if JWT_SECRET is set
if (!process.env.JWT_SECRET) {
  console.error('❌ ERROR: JWT_SECRET is not set in .env file!');
  console.error('Please create a .env file with JWT_SECRET=your_secret_key');
  process.exit(1);
}

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to log requests
app.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'GET') {
    console.log(`📨 ${req.method} ${req.path}`);
  }
  next();
});

try {
  const apiRoutes = require('./api/routes/index');
  app.use('/api', apiRoutes);
  console.log('✅ API routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading API routes:', error.message);
  process.exit(1);
}

// Serve index.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'index.html'));
});

// Serve HTML files from public/html directory
app.get('/*.html', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'html', req.params[0] + '.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.warn(`⚠️  File not found: ${req.path}`);
      res.status(404).sendFile(path.join(__dirname, 'public', 'html', 'index.html'));
    }
  });
});

// 404 handler for API routes
app.use('/api', (req, res) => {
  console.warn(`⚠️  404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({ success: false, message: 'API route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  res.status(500).json({ success: false, message: 'Server error' });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🔐 JWT_SECRET is configured`);
  console.log(`📁 Static files served from: ${path.join(__dirname, 'public')}`);
});