const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../constants');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, minlength: 2, maxlength: 60 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
      index: true,
    },
    password: { type: String, required: [true, 'Password is required'], minlength: 8, maxlength: 128, select: false },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.USER },
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  this.tokenVersion = (this.tokenVersion || 0) + 1;
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// NOTE: Output shaping is centralized in `dtos/index.js`. Do not add per-model
// toSafeJSON variants — keep a single source of truth.

module.exports = mongoose.model('User', userSchema);