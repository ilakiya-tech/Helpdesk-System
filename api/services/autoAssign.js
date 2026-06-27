// services/autoAssign.js
// Auto-assign a ticket to the best available staff member

const User    = require('../models/User');
const Ticket  = require('../models/Ticket');
const Holiday = require('../models/Holiday');
const { isNonWorkingDay } = require('./indianHolidays');

/**
 * Auto-assign a ticket to a staff member
 * Rules:
 *  1. Match staff by ticket category
 *  2. Today must not be a weekend or public holiday
 *  3. Staff must not have reached their maxTicketsPerDay limit
 *  4. Staff must not have 2+ open tickets created at the same time slot (within 1 hour)
 *
 * @param {Object} ticket – unsaved Ticket object (needs category, createdAt)
 * @returns {Object|null} – best staff User doc, or null if none available
 */
async function autoAssign(ticket) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Load holidays from DB
  const holidays = await Holiday.find({
    date: { $gte: today, $lt: tomorrow }
  });

  // Check if today is a non-working day
  if (isNonWorkingDay(new Date(), holidays)) {
    console.log('[AutoAssign] Today is a non-working day. Skipping assignment.');
    return null;
  }

  // Find active staff matching the category (case-insensitive)
  const category = (ticket.category || '').toLowerCase();
  const staffList = await User.find({
    role: 'staff',
    isActive: true,
    category: { $regex: new RegExp(`^${category}$`, 'i') }
  });

  if (staffList.length === 0) {
    console.log(`[AutoAssign] No staff found for category: ${ticket.category}`);
    return null;
  }

  // Count today's assigned tickets per staff member
  const staffWithLoad = await Promise.all(staffList.map(async (staff) => {
    const todayCount = await Ticket.countDocuments({
      assignedTo: staff._id,
      createdAt:  { $gte: today, $lt: tomorrow },
      status:     { $nin: ['Closed', 'Resolved'] }
    });

    // Check for time-slot collision (2+ tickets within 1 hour of new ticket)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const oneHourAhead = new Date(Date.now() + 60 * 60 * 1000);
    const slotCount = await Ticket.countDocuments({
      assignedTo: staff._id,
      createdAt:  { $gte: oneHourAgo, $lte: oneHourAhead },
      status:     { $nin: ['Closed', 'Resolved'] }
    });

    return { staff, todayCount, slotCount };
  }));

  // Filter: under daily limit AND no time-slot collision
  const available = staffWithLoad.filter(s =>
    s.todayCount < s.staff.maxTicketsPerDay && s.slotCount < 2
  );

  if (available.length === 0) {
    console.log('[AutoAssign] All matching staff are at capacity.');
    return null;
  }

  // Pick the staff with the fewest tickets today (lightest load)
  available.sort((a, b) => a.todayCount - b.todayCount);
  return available[0].staff;
}

module.exports = { autoAssign };
