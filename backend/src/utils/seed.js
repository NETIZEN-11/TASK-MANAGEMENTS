const mongoose = require('mongoose');
const database = require('../config/database');
const User = require('../models/user.model');
const Task = require('../models/task.model');

async function seed() {
  await database.connect();
  await User.deleteMany({});
  await Task.deleteMany({});

  const user = await User.create({
    name: 'Demo User',
    email: 'demo@example.com',
    password: 'password123',
  });

  await Task.insertMany([
    { title: 'Read System Design book', priority: 'high', owner: user._id, status: 'pending' },
    { title: 'Workout', priority: 'medium', owner: user._id, status: 'pending' },
    { title: 'Pay electricity bill', priority: 'high', owner: user._id, status: 'completed' },
    { title: 'Reply to emails', priority: 'low', owner: user._id, status: 'completed' },
  ]);

  console.log('Seed complete. Login with demo@example.com / password123');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});