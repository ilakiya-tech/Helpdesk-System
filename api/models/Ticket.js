const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  authorName:{ type: String },
  text:      { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const ticketSchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true },
  description:  { type: String, required: true },
  status:       { type: String, enum: ['Open','In Progress','Started','Needs Parts','Completed','Resolved','Closed'], default: 'Open' },
  priority:     { type: String, enum: ['Low','Medium','High','Critical'], default: 'Medium' },
  category:     { type: String, required: true },
  assignedTo:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedToName: { type: String, default: '' },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdByName:{ type: String, default: '' },
  customerName: { type: String, default: '' },
  email:        { type: String, default: '' },
  mobile:       { type: String, default: '' },
  comments:     [commentSchema],
  photoProof:   { type: String, default: '' }, // file path
  attachment:   { type: String, default: '' }, // client attachment
  dueDate:      { type: Date },
  resolvedAt:   { type: Date },
  autoAssigned: { type: Boolean, default: false },
}, { timestamps: true });

// Virtual id field for frontend compatibility
ticketSchema.virtual('id').get(function() {
  return this._id.toString().slice(-6); // short ID
});

ticketSchema.set('toJSON', { virtuals: true });
ticketSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Ticket', ticketSchema);
