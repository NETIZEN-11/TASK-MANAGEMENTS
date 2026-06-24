const { toUserDto, toTaskDto } = require('../dtos');

class DtoFactory {
  static createUserDto(userDoc) {
    return toUserDto(userDoc);
  }

  static createTaskDto(taskDoc) {
    return toTaskDto(taskDoc);
  }

  static createTaskList(taskDocs) {
    return taskDocs.map((d) => toTaskDto(d));
  }
}

module.exports = DtoFactory;
module.exports.DtoFactory = DtoFactory;