const { Router } = require('express');
const { authenticate } = require('../../middlewares/auth.middleware');
const validateObjectId = require('../../middlewares/objectId.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const {
  createTaskSchema,
  updateTaskSchema,
  listTasksQuerySchema,
} = require('../../validators');
const taskController = require('../../controllers/task.controller');

const router = Router();

router.use(authenticate);

router.get('/stats', taskController.getStats);
router.get('/', validate(listTasksQuerySchema, 'query'), taskController.listTasks);
router.post('/', validate(createTaskSchema), taskController.createTask);
router.get('/:id', validateObjectId('id'), taskController.getTask);
router.patch('/:id', validateObjectId('id'), validate(updateTaskSchema), taskController.updateTask);
router.post('/:id/toggle', validateObjectId('id'), taskController.toggleComplete);
router.delete('/:id', validateObjectId('id'), taskController.deleteTask);

module.exports = router;