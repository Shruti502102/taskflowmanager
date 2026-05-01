const router = require('express').Router();
const DB = require('../db');
const { auth } = require('../middleware');

// GET /api/dashboard
router.get('/', auth, (req, res) => {
  // Check if user is admin of any project
  const projects = DB.getProjectsForUser(req.user.id);
  const isAdminAny = projects.some(p => DB.getMemberRole(p.id, req.user.id) === 'admin');
  const stats = DB.getDashboardStats(req.user.id, false);
  res.json({ ...stats, projects: projects.length, isAdmin: isAdminAny });
});

module.exports = router;
