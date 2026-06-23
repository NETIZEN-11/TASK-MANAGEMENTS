const mongoose = require('mongoose');
const config = require('./index');
const logger = require('../utils/logger');

class Database {
  static #instance = null;

  constructor() {
    if (Database.#instance) {
      return Database.#instance;
    }
    Database.#instance = this;
    this.connection = null;
  }

  async connect() {
    if (this.connection) return this.connection;

    mongoose.set('strictQuery', true);

    mongoose.connection.on('connected', () => {
      logger.info(`MongoDB connected: ${this.#maskUri(config.mongoUri)}`);
    });
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    // IMPROVEMENT: Add connection pool configuration for production scalability
    const connectionOptions = {
      maxPoolSize: config.isProduction ? 50 : 10, // Larger pool for production
      minPoolSize: config.isProduction ? 10 : 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      family: 4, // Use IPv4, skip trying IPv6
    };

    this.connection = await mongoose.connect(config.mongoUri, connectionOptions);
    return this.connection;
  }

  async disconnect() {
    if (this.connection) {
      await mongoose.disconnect();
      this.connection = null;
    }
  }

  #maskUri(uri) {
    return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
  }
}

module.exports = new Database();