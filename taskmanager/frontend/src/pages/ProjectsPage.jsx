import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import Modal from '../components/Modal';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchProjects = () => {
    setLoading(true);
    api.get('/projects').then(setProjects).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(fetchProjects, []);

  const createProject = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      const p = await api.post('/projects', form);
      setProjects(prev => [p, ...prev]);
      setShowCreate(false);
      setForm({ name: '', description: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ padding: '32px 36px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Projects</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>Manage your team's workspaces</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + New Project
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <span className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>◈</div>
          <h3 style={{ fontFamily: 'Syne', marginBottom: 8 }}>No projects yet</h3>
          <p style={{ color: 'var(--text2)', marginBottom: 24, fontSize: 14 }}>
            Create your first project to start collaborating
          </p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Create Project</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
          {projects.map(p => (
            <ProjectCard key={p.id} project={p} onClick={() => navigate(`/projects/${p.id}`)} onDeleted={fetchProjects} />
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => { setShowCreate(false); setError(''); }} title="Create New Project">
        <form onSubmit={createProject}>
          <div className="form-group">
            <label>Project Name *</label>
            <input autoFocus value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Marketing Website, Mobile App..." required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="What's this project about?" style={{ resize: 'vertical' }} />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)} style={{ flex: 1, justifyContent: 'center' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={creating} style={{ flex: 1, justifyContent: 'center' }}>
              {creating ? <span className="spinner" /> : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function ProjectCard({ project, onClick, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api.delete(`/projects/${project.id}`);
      onDeleted();
    } catch (err) {
      alert(err.message);
      setDeleting(false);
    }
  };

  const colors = ['#6c63ff', '#22d3a0', '#f5c542', '#ff5f6d', '#ff9f43', '#38bdf8'];
  const color = colors[project.name.charCodeAt(0) % colors.length];

  return (
    <div className="card" onClick={onClick} style={{
      cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
      borderTop: `3px solid ${color}`,
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${color}22`, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontFamily: 'Syne', fontWeight: 800, color
        }}>
          {project.name[0].toUpperCase()}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span className={`badge badge-${project.role}`}>{project.role}</span>
          {project.role === 'admin' && (
            <button onClick={handleDelete} disabled={deleting} style={{
              background: 'none', color: 'var(--text2)', fontSize: 14,
              padding: '4px 6px', borderRadius: 6, transition: 'color 0.15s'
            }} title="Delete project"
              onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text2)'}>
              🗑
            </button>
          )}
        </div>
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{project.name}</h3>
      {project.description && (
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16, lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          {project.description}
        </p>
      )}
      <div style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 12, color: 'var(--text2)' }}>
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>{project.memberCount ?? 0}</span> members
        </div>
        <div style={{ fontSize: 12, color: 'var(--text2)' }}>
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>{project.taskCount ?? 0}</span> tasks
        </div>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginLeft: 'auto' }}>
          {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      </div>
    </div>
  );
}
