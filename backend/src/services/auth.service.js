const jwt = require('jsonwebtoken');
const config = require('../config');
const userRepository = require('../repositories/user.repository');
const ApiError = require('../utils/ApiError');
const DtoFactory = require('../factories/dto.factory');

function signToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      tv: user.tokenVersion || 0,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

class AuthService {
  constructor({ userRepo = userRepository } = {}) {
    this.userRepo = userRepo;
  }

  async signup({ name, email, password }) {
    const existing = await this.userRepo.emailExists(email);
    if (existing) {
      throw ApiError.conflict('Email is already registered');
    }
    const user = await this.userRepo.create({ name, email, password });
    const token = signToken(user);
    return { user: DtoFactory.createUserDto(user), token };
  }

  async login({ email, password }) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw ApiError.unauthorized('Invalid email or password');
    const ok = await user.comparePassword(password);
    if (!ok) throw ApiError.unauthorized('Invalid email or password');
    const token = signToken(user);
    return { user: DtoFactory.createUserDto(user), token };
  }
}

module.exports = new AuthService();
module.exports.AuthService = AuthService;