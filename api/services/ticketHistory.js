// services/ticketHistory.js – Ticket audit trail helper

async function addTicketHistory(ticket, { action, userId, userName, field, oldValue, newValue }) {
  if (!ticket.history) ticket.history = [];
  ticket.history.push({
    action,
    changedBy: userId,
    changedByName: userName,
    field: field || '',
    oldValue: String(oldValue ?? ''),
    newValue: String(newValue ?? ''),
  });
}

module.exports = { addTicketHistory };
