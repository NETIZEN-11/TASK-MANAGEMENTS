const User = require('../models/user.model');

class UserRepository {
  async create({ name, email, password }) {
    const user = await User.create({ name, email, password });
    return user;
  }

  async findById(id) {
    return User.findById(id);
  }

  async findByIdWithPassword(id) {
    return User.findById(id).select('+password');
  }

  async findByEmail(email) {
    return User.findOne({ email: email.toLowerCase() }).select('+password');
  }

  async emailExists(email) {
    return User.exists({ email: email.toLowerCase() });
  }
}

module.exports = new UserRepository();