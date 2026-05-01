const { Low } = require('lowdb');
const { JSONFileSync } = require('lowdb/node');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../data/db.json');
const fs = require('fs');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const adapter = new JSONFileSync(dbPath);
const db = new Low(adapter, {
  users: [],
  projects: [],
  projectMembers: [],
  tasks: []
});

db.read();
db.write();

// Helper functions
const DB = {
  // ─── USERS ───────────────────────────────────────────────
  createUser({ name, email, passwordHash }) {
    db.read();
    const user = { id: uuidv4(), name, email, passwordHash, createdAt: new Date().toISOString() };
    db.data.users.push(user);
    db.write();
    return user;
  },
  findUserByEmail(email) {
    db.read();
    return db.data.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },
  findUserById(id) {
    db.read();
    return db.data.users.find(u => u.id === id) || null;
  },
  getAllUsers() {
    db.read();
    return db.data.users.map(u => ({ id: u.id, name: u.name, email: u.email }));
  },

  // ─── PROJECTS ────────────────────────────────────────────
  createProject({ name, description, adminId }) {
    db.read();
    const project = { id: uuidv4(), name, description, adminId, createdAt: new Date().toISOString() };
    db.data.projects.push(project);
    // Admin is also a member
    db.data.projectMembers.push({ id: uuidv4(), projectId: project.id, userId: adminId, role: 'admin' });
    db.write();
    return project;
  },
  findProjectById(id) {
    db.read();
    return db.data.projects.find(p => p.id === id) || null;
  },
  getProjectsForUser(userId) {
    db.read();
    const memberProjectIds = db.data.projectMembers.filter(m => m.userId === userId).map(m => m.projectId);
    return db.data.projects.filter(p => memberProjectIds.includes(p.id));
  },
  getAllProjects() {
    db.read();
    return db.data.projects;
  },
  deleteProject(id) {
    db.read();
    db.data.projects = db.data.projects.filter(p => p.id !== id);
    db.data.projectMembers = db.data.projectMembers.filter(m => m.projectId !== id);
    db.data.tasks = db.data.tasks.filter(t => t.projectId !== id);
    db.write();
  },

  // ─── PROJECT MEMBERS ─────────────────────────────────────
  addMember({ projectId, userId, role = 'member' }) {
    db.read();
    const exists = db.data.projectMembers.find(m => m.projectId === projectId && m.userId === userId);
    if (exists) return exists;
    const m = { id: uuidv4(), projectId, userId, role };
    db.data.projectMembers.push(m);
    db.write();
    return m;
  },
  removeMember({ projectId, userId }) {
    db.read();
    db.data.projectMembers = db.data.projectMembers.filter(
      m => !(m.projectId === projectId && m.userId === userId)
    );
    db.write();
  },
  getMembersOfProject(projectId) {
    db.read();
    return db.data.projectMembers
      .filter(m => m.projectId === projectId)
      .map(m => {
        const user = db.data.users.find(u => u.id === m.userId);
        return user ? { id: user.id, name: user.name, email: user.email, role: m.role } : null;
      })
      .filter(Boolean);
  },
  getMemberRole(projectId, userId) {
    db.read();
    const m = db.data.projectMembers.find(m => m.projectId === projectId && m.userId === userId);
    return m ? m.role : null;
  },

  // ─── TASKS ───────────────────────────────────────────────
  createTask({ projectId, title, description, dueDate, priority, assigneeId, createdBy }) {
    db.read();
    const task = {
      id: uuidv4(), projectId, title, description,
      dueDate: dueDate || null, priority: priority || 'medium',
      status: 'todo', assigneeId: assigneeId || null, createdBy,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    db.data.tasks.push(task);
    db.write();
    return task;
  },
  findTaskById(id) {
    db.read();
    return db.data.tasks.find(t => t.id === id) || null;
  },
  getTasksForProject(projectId) {
    db.read();
    return db.data.tasks.filter(t => t.projectId === projectId);
  },
  getTasksForUser(userId) {
    db.read();
    return db.data.tasks.filter(t => t.assigneeId === userId);
  },
  updateTask(id, updates) {
    db.read();
    const idx = db.data.tasks.findIndex(t => t.id === id);
    if (idx === -1) return null;
    db.data.tasks[idx] = { ...db.data.tasks[idx], ...updates, updatedAt: new Date().toISOString() };
    db.write();
    return db.data.tasks[idx];
  },
  deleteTask(id) {
    db.read();
    db.data.tasks = db.data.tasks.filter(t => t.id !== id);
    db.write();
  },
  getAllTasks() {
    db.read();
    return db.data.tasks;
  },

  // ─── DASHBOARD ───────────────────────────────────────────
  getDashboardStats(userId, isAdmin) {
    db.read();
    let tasks;
    if (isAdmin) {
      tasks = db.data.tasks;
    } else {
      const myProjectIds = db.data.projectMembers.filter(m => m.userId === userId).map(m => m.projectId);
      tasks = db.data.tasks.filter(t => myProjectIds.includes(t.projectId));
    }

    const now = new Date();
    const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done');
    const byStatus = {
      todo: tasks.filter(t => t.status === 'todo').length,
      inprogress: tasks.filter(t => t.status === 'inprogress').length,
      done: tasks.filter(t => t.status === 'done').length,
    };

    // Tasks per user (top 5)
    const perUser = {};
    tasks.forEach(t => {
      if (t.assigneeId) {
        perUser[t.assigneeId] = (perUser[t.assigneeId] || 0) + 1;
      }
    });
    const tasksPerUser = Object.entries(perUser).map(([uid, count]) => {
      const user = db.data.users.find(u => u.id === uid);
      return { userId: uid, name: user?.name || 'Unknown', count };
    }).sort((a, b) => b.count - a.count).slice(0, 5);

    return {
      total: tasks.length,
      byStatus,
      overdue: overdue.length,
      tasksPerUser,
      recentTasks: tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
    };
  }
};

module.exports = DB;
