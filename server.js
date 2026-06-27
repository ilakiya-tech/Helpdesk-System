require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const mongoose = require('mongoose');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Static files ───────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public', 'html')));

// ── API Routes ─────────────────────────────────────────────────────────────
app.use('/api', require('./api/routes/index'));

// ── Root ───────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'index.html'));
});

// ── Error handler ─────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ── MongoDB connection with in-memory fallback ────────────────────────────
async function startServer() {
  let mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/helpdesk';

  try {
    // Try real MongoDB first (5 second timeout)
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ MongoDB connected:', mongoUri);
  } catch (err) {
    console.log('⚠️  Real MongoDB not available:', err.message);
    console.log('🔄 Falling back to in-memory MongoDB...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const memServer = await MongoMemoryServer.create();
      mongoUri = memServer.getUri();
      await mongoose.connect(mongoUri);
      console.log('✅ In-memory MongoDB started:', mongoUri);

      // Seed in-memory DB automatically
      await require('./api/seedData')();
      console.log('✅ Auto-seeded in-memory database');
    } catch (memErr) {
      console.error('❌ Failed to start in-memory MongoDB:', memErr.message);
      console.log('\n💡 To fix: Install MongoDB from https://www.mongodb.com/try/download/community');
      console.log('   OR start MongoDB: net start MongoDB');
      process.exit(1);
    }
  }

  app.listen(PORT, () => {
    console.log(`\n🚀 Carbochem Helpdesk → http://localhost:${PORT}`);
    console.log('📋 Login: admin/admin123 | staff/staff123 | client/client123\n');
  });
}

startServer();
