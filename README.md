# taskflowmanager
# TaskFlow – Team Task Manager

A full-stack collaborative task management application built with React + Node.js/Express + JSON database.

---

## 🚀 Live Demo

Deploy URL: (fill in after Railway deployment)

---

## ✅ Features

- **Authentication** – JWT-based signup/login with bcrypt password hashing
- **Projects** – Create projects, invite members by email, role-based access (Admin/Member)
- **Tasks** – Create tasks with title, description, due date, priority, assignee
- **Kanban Board** – Drag-friendly board with To Do / In Progress / Done columns
- **List View** – Filterable, searchable task list with inline status updates
- **My Tasks** – All tasks assigned to the current user across all projects
- **Dashboard** – Stats: total tasks, by status, overdue count, top assignees, recent activity
- **Role-Based Access** – Admins manage everything; Members update only their own tasks
- **Overdue Alerts** – Visual warnings for past-due tasks

---

## 🗂 Project Structure

```
taskflow/
├── backend/
│   ├── src/
│   │   ├── server.js          # Express app entry point
│   │   ├── db.js              # JSON database layer (lowdb)
│   │   ├── middleware.js      # JWT auth middleware
│   │   └── routes/
│   │       ├── auth.js        # POST /api/auth/signup, /login, /me
│   │       ├── projects.js    # CRUD projects + member management
│   │       ├── tasks.js       # CRUD tasks per project
│   │       └── dashboard.js   # GET /api/dashboard stats
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx            # Router + auth guard
│   │   ├── styles.css         # Global design system
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── utils/
│   │   │   └── api.js         # Fetch wrapper with auth headers
│   │   ├── components/
│   │   │   ├── Layout.jsx     # Sidebar navigation
│   │   │   └── Modal.jsx      # Reusable modal
│   │   └── pages/
│   │       ├── AuthPage.jsx         # Login + Signup
│   │       ├── DashboardPage.jsx    # Stats overview
│   │       ├── ProjectsPage.jsx     # Project grid
│   │       ├── ProjectDetailPage.jsx # Kanban + list + members
│   │       └── TasksPage.jsx        # My assigned tasks
│   └── package.json
├── nixpacks.toml              # Railway build config
├── package.json               # Root scripts
└── README.md
```

---

## 🛠 Local Setup

### Prerequisites
- Node.js 18+
- npm

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd taskflow

# Install backend deps
cd backend && npm install && cd ..

# Install & build frontend
cd frontend && npm install && npm run build && cd ..
```

### 2. Configure Environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env — change JWT_SECRET to something secure
```

### 3. Run

```bash
cd backend && node src/server.js
```

Open http://localhost:5000 in your browser.

**For development with hot reload:**
```bash
# Terminal 1 – backend
cd backend && npm run dev

# Terminal 2 – frontend
cd frontend && npm run dev
# Open http://localhost:5173
```

---

## 🌐 Deploy to Railway

### One-click deployment:

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
3. Select your repository
4. Railway auto-detects `nixpacks.toml` and builds both frontend + backend
5. Set environment variables in Railway dashboard:
   ```
   JWT_SECRET=your-long-random-secret-here
   NODE_ENV=production
   ```
6. Railway assigns a public URL — share it!

### Environment Variables (Railway Dashboard)

| Variable | Value |
|----------|-------|
| `JWT_SECRET` | Any long random string |
| `NODE_ENV` | `production` |
| `PORT` | (Railway sets this automatically) |

---

## 📡 API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | No | Create account |
| POST | `/api/auth/login` | No | Login, get JWT |
| GET | `/api/auth/me` | Yes | Get current user |

### Projects
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/projects` | Yes | Any | List my projects |
| POST | `/api/projects` | Yes | Any | Create project (becomes admin) |
| GET | `/api/projects/:id` | Yes | Member+ | Project details + tasks + members |
| DELETE | `/api/projects/:id` | Yes | Admin | Delete project |
| POST | `/api/projects/:id/members` | Yes | Admin | Add member by email |
| DELETE | `/api/projects/:id/members/:userId` | Yes | Admin | Remove member |

### Tasks
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/tasks/my` | Yes | Any | My assigned tasks |
| GET | `/api/tasks/project/:id` | Yes | Member+ | Project tasks |
| POST | `/api/tasks/project/:id` | Yes | Admin | Create task |
| PATCH | `/api/tasks/:id` | Yes | Admin/Assignee | Update task |
| DELETE | `/api/tasks/:id` | Yes | Admin | Delete task |

### Dashboard
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/dashboard` | Yes | Stats: totals, by status, overdue, per user |

---

## 🔐 Role-Based Access Control

| Action | Admin | Member |
|--------|-------|--------|
| Create/delete tasks | ✅ | ❌ |
| Edit any task | ✅ | ❌ |
| Update own task status | ✅ | ✅ |
| Add/remove members | ✅ | ❌ |
| View project board | ✅ | ✅ |
| Delete project | ✅ | ❌ |

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Vite |
| Backend | Node.js, Express 4 |
| Database | lowdb (JSON file, zero native deps) |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Validation | express-validator |
| Deployment | Railway (nixpacks) |

---

## 📝 Notes

- The database uses a local JSON file (`backend/data/db.json`). On Railway this persists for the lifetime of the deployment.
- For production with heavy load, swap `lowdb` for PostgreSQL (Railway provides managed Postgres). The `DB` module in `db.js` can be replaced with a `pg` adapter without changing any route code.
- All passwords are hashed with bcrypt (10 rounds). JWTs expire in 7 days.
