class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.success = statusCode >= 200 && statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }

  send(res) {
    return res.status(this.statusCode).json(this);
  }
}

module.exports = ApiResponse;