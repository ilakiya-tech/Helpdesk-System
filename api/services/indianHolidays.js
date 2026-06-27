// services/indianHolidays.js
// Indian public holidays 2025 (national + major) – used as seed data

const HOLIDAYS_2025 = [
  { date: '2025-01-01', name: "New Year's Day",        type: 'optional' },
  { date: '2025-01-14', name: 'Makar Sankranti',       type: 'regional' },
  { date: '2025-01-26', name: 'Republic Day',           type: 'national' },
  { date: '2025-03-14', name: 'Holi',                   type: 'national' },
  { date: '2025-03-31', name: 'Eid ul-Fitr',            type: 'national' },
  { date: '2025-04-14', name: 'Ambedkar Jayanti',       type: 'national' },
  { date: '2025-04-18', name: 'Good Friday',            type: 'national' },
  { date: '2025-05-01', name: 'Maharashtra Day / May Day', type: 'regional' },
  { date: '2025-06-07', name: 'Eid ul-Adha',            type: 'national' },
  { date: '2025-08-15', name: 'Independence Day',        type: 'national' },
  { date: '2025-08-16', name: 'Janmashtami',             type: 'national' },
  { date: '2025-08-27', name: 'Ganesh Chaturthi',        type: 'national' },
  { date: '2025-10-02', name: 'Gandhi Jayanti / Dussehra', type: 'national' },
  { date: '2025-10-20', name: 'Diwali (Lakshmi Puja)',  type: 'national' },
  { date: '2025-10-21', name: 'Diwali (Bhai Dooj)',     type: 'optional' },
  { date: '2025-11-05', name: 'Guru Nanak Jayanti',     type: 'national' },
  { date: '2025-12-25', name: 'Christmas Day',           type: 'national' },
];

/**
 * Check if a given date is a public holiday (from DB list + weekends)
 * @param {Date} date
 * @param {Array} dbHolidays – array of Holiday documents from MongoDB
 * @returns {boolean}
 */
function isNonWorkingDay(date, dbHolidays = []) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return true; // weekend

  const iso = d.toISOString().split('T')[0];
  return dbHolidays.some(h => {
    const hDate = new Date(h.date).toISOString().split('T')[0];
    return hDate === iso;
  });
}

module.exports = { HOLIDAYS_2025, isNonWorkingDay };
