// api/seedData.js – Reusable seed function (called by seed.js and in-memory fallback)

const User    = require('./models/User');
const Ticket  = require('./models/Ticket');
const Holiday = require('./models/Holiday');
const { HOLIDAYS_2025 } = require('./services/indianHolidays');

async function seedDatabase() {
  // Check if already seeded
  const count = await User.countDocuments();
  if (count > 0) {
    console.log('[Seed] Database already has data, skipping seed');
    return;
  }

  // ── Users ─────────────────────────────────────────────────────────────
  const usersData = [
    // Admins
    { name:'Admin User',   username:'admin',      email:'admin@carbochem.com',      password:'admin123',  role:'admin' },
    { name:'Manager',      username:'manager',    email:'manager@carbochem.com',    password:'admin123',  role:'admin' },
    { name:'Supervisor',   username:'supervisor', email:'supervisor@carbochem.com', password:'admin123',  role:'admin' },
    // Staff (one per category)
    { name:'Ravi Kumar',   username:'ravi',   email:'ravi@carbochem.com',   password:'staff123', role:'staff', category:'Network',    maxTicketsPerDay:5 },
    { name:'Priya Singh',  username:'priya',  email:'priya@carbochem.com',  password:'staff123', role:'staff', category:'Hardware',   maxTicketsPerDay:5 },
    { name:'Amit Sharma',  username:'amit',   email:'amit@carbochem.com',   password:'staff123', role:'staff', category:'Software',   maxTicketsPerDay:5 },
    { name:'Sunita Patil', username:'sunita', email:'sunita@carbochem.com', password:'staff123', role:'staff', category:'Quality',    maxTicketsPerDay:5 },
    { name:'Deepak Nair',  username:'deepak', email:'deepak@carbochem.com', password:'staff123', role:'staff', category:'Inspection', maxTicketsPerDay:5 },
    // Backward-compat staff username
    { name:'Field Staff',  username:'staff',  email:'staff@carbochem.com',  password:'staff123', role:'staff', category:'Quality',    maxTicketsPerDay:5 },
    // Clients
    { name:'John Doe',    username:'client',  email:'client@carbochem.com',  password:'client123', role:'client' },
    { name:'Jane Smith',  username:'jane',    email:'jane@carbochem.com',    password:'client123', role:'client' },
    { name:'Bob Johnson', username:'bob',     email:'bob@carbochem.com',     password:'client123', role:'client' },
  ];

  const saved = {};
  for (const u of usersData) {
    const doc = new User({ ...u, isVerified: true });
    await doc.save();
    saved[u.username] = doc;
  }
  console.log(`[Seed] Created ${Object.keys(saved).length} users`);

  // ── Tickets ───────────────────────────────────────────────────────────
  const tickets = [
    {
      title: 'System Login Issue',
      description: 'Unable to login to the ERP system after recent password reset. Getting invalid credentials error.',
      status: 'Open', priority: 'High', category: 'Software',
      customerName: 'John Doe', email: 'client@carbochem.com', mobile: '9876543210',
      createdBy: saved['client']._id, createdByName: 'John Doe',
      dueDate: new Date(Date.now() + 7*24*60*60*1000),
    },
    {
      title: 'Product Quality Concern',
      description: 'Damaged packaging found on the latest batch delivery. Multiple units affected with visible cracks.',
      status: 'In Progress', priority: 'Medium', category: 'Quality',
      customerName: 'Jane Smith', email: 'jane@carbochem.com', mobile: '9123456789',
      createdBy: saved['jane']._id, createdByName: 'Jane Smith',
      assignedTo: saved['sunita']._id, assignedToName: 'Sunita Patil', autoAssigned: true,
      dueDate: new Date(Date.now() + 5*24*60*60*1000),
    },
    {
      title: 'On-site Inspection Required',
      description: 'Need urgent on-site inspection for tank installation at Plant B. Safety concern flagged by site engineer.',
      status: 'Open', priority: 'Critical', category: 'Inspection',
      customerName: 'Bob Johnson', email: 'bob@carbochem.com', mobile: '9988776655',
      createdBy: saved['bob']._id, createdByName: 'Bob Johnson',
      assignedTo: saved['deepak']._id, assignedToName: 'Deepak Nair', autoAssigned: true,
      dueDate: new Date(Date.now() + 2*24*60*60*1000),
    },
    {
      title: 'Wrong Items Delivered',
      description: 'Wrong chemical drums delivered to construction site. Need replacement of 50L drums with correct spec.',
      status: 'Resolved', priority: 'High', category: 'Delivery',
      customerName: 'John Doe', email: 'client@carbochem.com', mobile: '9876543210',
      createdBy: saved['client']._id, createdByName: 'John Doe',
      resolvedAt: new Date(),
      dueDate: new Date(Date.now() - 1*24*60*60*1000),
    },
    {
      title: 'Network Connectivity Issue',
      description: 'Intermittent network drops at warehouse causing barcode scanner failures.',
      status: 'Open', priority: 'Medium', category: 'Network',
      customerName: 'Jane Smith', email: 'jane@carbochem.com', mobile: '9123456789',
      createdBy: saved['jane']._id, createdByName: 'Jane Smith',
      assignedTo: saved['ravi']._id, assignedToName: 'Ravi Kumar', autoAssigned: true,
      dueDate: new Date(Date.now() + 3*24*60*60*1000),
    },
  ];

  await Ticket.insertMany(tickets);
  console.log(`[Seed] Created ${tickets.length} tickets`);

  // ── Holidays ──────────────────────────────────────────────────────────
  const holidayDocs = HOLIDAYS_2025.map(h => ({ date: new Date(h.date), name: h.name, type: h.type }));
  await Holiday.insertMany(holidayDocs);
  console.log(`[Seed] Created ${holidayDocs.length} holidays`);

  console.log('[Seed] ✅ Done');
}

module.exports = seedDatabase;
