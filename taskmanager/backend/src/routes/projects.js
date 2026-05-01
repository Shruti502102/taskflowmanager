const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const DB = require('../db');
const { auth } = require('../middleware');

// GET /api/projects – projects for current user
router.get('/', auth, (req, res) => {
  const projects = DB.getProjectsForUser(req.user.id);
  const enriched = projects.map(p => ({
    ...p,
    role: DB.getMemberRole(p.id, req.user.id),
    memberCount: DB.getMembersOfProject(p.id).length,
    taskCount: DB.getTasksForProject(p.id).length
  }));
  res.json(enriched);
});

// GET /api/projects/all – admin sees all
router.get('/all', auth, (req, res) => {
  const projects = DB.getAllProjects();
  res.json(projects);
});

// POST /api/projects
router.post('/', auth, [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('description').optional().trim()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { name, description } = req.body;
  const project = DB.createProject({ name, description, adminId: req.user.id });
  res.status(201).json({ ...project, role: 'admin' });
});

// GET /api/projects/:id
router.get('/:id', auth, (req, res) => {
  const project = DB.findProjectById(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const role = DB.getMemberRole(req.params.id, req.user.id);
  if (!role) return res.status(403).json({ error: 'Access denied' });
  const members = DB.getMembersOfProject(req.params.id);
  const tasks = DB.getTasksForProject(req.params.id);
  res.json({ ...project, role, members, tasks });
});

// DELETE /api/projects/:id
router.delete('/:id', auth, (req, res) => {
  const project = DB.findProjectById(req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });
  if (project.adminId !== req.user.id) return res.status(403).json({ error: 'Admin only' });
  DB.deleteProject(req.params.id);
  res.json({ message: 'Project deleted' });
});

// POST /api/projects/:id/members
router.post('/:id/members', auth, [
  body('email').isEmail().normalizeEmail()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const project = DB.findProjectById(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (project.adminId !== req.user.id) return res.status(403).json({ error: 'Admin only' });

  const targetUser = DB.findUserByEmail(req.body.email);
  if (!targetUser) return res.status(404).json({ error: 'User not found with that email' });

  DB.addMember({ projectId: req.params.id, userId: targetUser.id, role: 'member' });
  res.json({ message: 'Member added', user: { id: targetUser.id, name: targetUser.name, email: targetUser.email, role: 'member' } });
});

// DELETE /api/projects/:id/members/:userId
router.delete('/:id/members/:userId', auth, (req, res) => {
  const project = DB.findProjectById(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (project.adminId !== req.user.id) return res.status(403).json({ error: 'Admin only' });
  if (req.params.userId === project.adminId) return res.status(400).json({ error: 'Cannot remove admin' });
  DB.removeMember({ projectId: req.params.id, userId: req.params.userId });
  res.json({ message: 'Member removed' });
});

// GET /api/projects/:id/members
router.get('/:id/members', auth, (req, res) => {
  const project = DB.findProjectById(req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });
  const role = DB.getMemberRole(req.params.id, req.user.id);
  if (!role) return res.status(403).json({ error: 'Access denied' });
  res.json(DB.getMembersOfProject(req.params.id));
});

module.exports = router;
