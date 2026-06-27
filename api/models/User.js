const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  email:    { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  phone:    { type: String, default: '' },
  department: { type: String, default: '' },
  availability: { type: String, enum: ['available', 'on_leave', 'busy'], default: 'available' },
  role:     { type: String, enum: ['admin', 'staff', 'client'], default: 'client' },
  category: { type: String, default: '' }, // staff specialization
  maxTicketsPerDay: { type: Number, default: 5 },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: true }, // email verified
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Return safe user object (no password)
userSchema.methods.toSafeObject = function () {
  return {
    userId: this._id.toString(),
    username: this.username,
    name: this.name,
    email: this.email,
    phone: this.phone,
    department: this.department,
    availability: this.availability,
    role: this.role,
    category: this.category,
    maxTicketsPerDay: this.maxTicketsPerDay,
    isActive: this.isActive,
  };
};

module.exports = mongoose.model('User', userSchema);
