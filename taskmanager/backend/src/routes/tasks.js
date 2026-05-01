const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const DB = require('../db');
const { auth } = require('../middleware');

// GET /api/tasks – all tasks assigned to current user
router.get('/my', auth, (req, res) => {
  const tasks = DB.getTasksForUser(req.user.id);
  res.json(tasks);
});

// GET /api/tasks/project/:projectId
router.get('/project/:projectId', auth, (req, res) => {
  const role = DB.getMemberRole(req.params.projectId, req.user.id);
  if (!role) return res.status(403).json({ error: 'Access denied' });
  const tasks = DB.getTasksForProject(req.params.projectId);
  // Enrich with assignee names
  const enriched = tasks.map(t => {
    if (t.assigneeId) {
      const u = DB.findUserById(t.assigneeId);
      return { ...t, assigneeName: u?.name || null };
    }
    return t;
  });
  res.json(enriched);
});

// POST /api/tasks/project/:projectId
router.post('/project/:projectId', auth, [
  body('title').trim().notEmpty().withMessage('Title required'),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('status').optional().isIn(['todo', 'inprogress', 'done']),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const role = DB.getMemberRole(req.params.projectId, req.user.id);
  if (!role) return res.status(403).json({ error: 'Access denied' });

  // Only admins can create tasks
  if (role !== 'admin') return res.status(403).json({ error: 'Only admins can create tasks' });

  const { title, description, dueDate, priority, assigneeId } = req.body;

  // Validate assignee is in project
  if (assigneeId) {
    const assigneeRole = DB.getMemberRole(req.params.projectId, assigneeId);
    if (!assigneeRole) return res.status(400).json({ error: 'Assignee is not a project member' });
  }

  const task = DB.createTask({
    projectId: req.params.projectId, title, description,
    dueDate, priority, assigneeId, createdBy: req.user.id
  });
  res.status(201).json(task);
});

// PATCH /api/tasks/:id
router.patch('/:id', auth, [
  body('status').optional().isIn(['todo', 'inprogress', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const task = DB.findTaskById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const role = DB.getMemberRole(task.projectId, req.user.id);
  if (!role) return res.status(403).json({ error: 'Access denied' });

  // Members can only update status of their own tasks
  if (role === 'member') {
    if (task.assigneeId !== req.user.id) return res.status(403).json({ error: 'Not your task' });
    const { status } = req.body;
    const updated = DB.updateTask(req.params.id, { status });
    return res.json(updated);
  }

  // Admin can update everything
  const { title, description, dueDate, priority, status, assigneeId } = req.body;
  const updated = DB.updateTask(req.params.id, {
    ...(title && { title }),
    ...(description !== undefined && { description }),
    ...(dueDate !== undefined && { dueDate }),
    ...(priority && { priority }),
    ...(status && { status }),
    ...(assigneeId !== undefined && { assigneeId }),
  });
  res.json(updated);
});

// DELETE /api/tasks/:id
router.delete('/:id', auth, (req, res) => {
  const task = DB.findTaskById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Not found' });
  const role = DB.getMemberRole(task.projectId, req.user.id);
  if (role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  DB.deleteTask(req.params.id);
  res.json({ message: 'Task deleted' });
});

// GET /api/tasks/:id
router.get('/:id', auth, (req, res) => {
  const task = DB.findTaskById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Not found' });
  const role = DB.getMemberRole(task.projectId, req.user.id);
  if (!role) return res.status(403).json({ error: 'Access denied' });
  const assignee = task.assigneeId ? DB.findUserById(task.assigneeId) : null;
  res.json({ ...task, assigneeName: assignee?.name || null });
});

module.exports = router;
