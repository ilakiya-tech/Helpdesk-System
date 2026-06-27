// api/seed.js – Run this to seed the database
// Usage: node api/seed.js

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose   = require('mongoose');
const User       = require('./models/User');
const Ticket     = require('./models/Ticket');
const Holiday    = require('./models/Holiday');
const seedDatabase = require('./seedData');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/helpdesk';

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB:', MONGO_URI);

  // Clear all data first
  await Promise.all([User.deleteMany(), Ticket.deleteMany(), Holiday.deleteMany()]);
  console.log('🗑️  Cleared existing data');

  await seedDatabase();

  console.log('\n✅ Seed complete!');
  console.log('Login credentials:');
  console.log('  Admin:  admin / admin123');
  console.log('  Staff:  staff / staff123  (or ravi/priya/amit/sunita/deepak)');
  console.log('  Client: client / client123');
  console.log('\nStart server: node server.js');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Seed failed:', err.message);
  console.log('\n💡 Make sure MongoDB is running:');
  console.log('   net start MongoDB');
  console.log('   OR: mongod --dbpath C:\\data\\db');
  process.exit(1);
});
