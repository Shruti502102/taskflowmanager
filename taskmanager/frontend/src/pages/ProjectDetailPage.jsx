import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const STATUSES = [
  { key: 'todo',       label: 'To Do',       color: 'var(--text2)',  bg: 'rgba(136,136,170,0.1)' },
  { key: 'inprogress', label: 'In Progress',  color: 'var(--yellow)', bg: 'rgba(245,197,66,0.1)' },
  { key: 'done',       label: 'Done',         color: 'var(--green)',  bg: 'rgba(34,211,160,0.1)'  },
];
const PRIORITIES = ['low','medium','high'];

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks]     = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole]       = useState('member');
  const [tab, setTab]         = useState('board');
  const [error, setError]     = useState('');

  // Modal states
  const [showTask,   setShowTask]   = useState(false);
  const [editTask,   setEditTask]   = useState(null); // null = create, obj = edit
  const [showMember, setShowMember] = useState(false);
  const [showDetail, setShowDetail] = useState(null); // task detail

  const fetchProject = async () => {
    try {
      const data = await api.get(`/projects/${id}`);
      setProject(data);
      setTasks(data.tasks || []);
      setMembers(data.members || []);
      setRole(data.role);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProject(); }, [id]);

  const refreshTasks = async () => {
    const data = await api.get(`/tasks/project/${id}`);
    setTasks(data);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <span className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  if (error) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <p style={{ color: 'var(--red)', marginBottom: 16 }}>{error}</p>
      <button className="btn btn-ghost" onClick={() => navigate('/projects')}>← Back</button>
    </div>
  );

  const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length;

  return (
    <div style={{ padding: '28px 36px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <button onClick={() => navigate('/projects')} style={{
          background: 'none', color: 'var(--text2)', fontSize: 13, marginBottom: 12,
          display: 'flex', alignItems: 'center', gap: 4
        }}>← Projects</button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{project.name}</h1>
            {project.description && <p style={{ color: 'var(--text2)', fontSize: 14 }}>{project.description}</p>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {role === 'admin' && (
              <>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowMember(true)}>+ Add Member</button>
                <button className="btn btn-primary btn-sm" onClick={() => { setEditTask(null); setShowTask(true); }}>+ Task</button>
              </>
            )}
          </div>
        </div>
        {/* Mini stats */}
        <div style={{ display: 'flex', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Tasks', val: tasks.length, color: 'var(--text)' },
            { label: 'In Progress', val: tasks.filter(t => t.status === 'inprogress').length, color: 'var(--yellow)' },
            { label: 'Done', val: tasks.filter(t => t.status === 'done').length, color: 'var(--green)' },
            { label: 'Overdue', val: overdue, color: overdue > 0 ? 'var(--red)' : 'var(--text2)' },
            { label: 'Members', val: members.length, color: 'var(--accent2)' },
          ].map(s => (
            <div key={s.label} style={{ fontSize: 13 }}>
              <span style={{ color: s.color, fontWeight: 700, fontSize: 18, fontFamily: 'Syne' }}>{s.val}</span>
              <span style={{ color: 'var(--text2)', marginLeft: 4 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 1 }}>
        {[
          { key: 'board', label: '⊞ Board' },
          { key: 'list',  label: '☰ List'  },
          { key: 'members', label: '👥 Members' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background: 'none', padding: '8px 16px', fontSize: 14,
            color: tab === t.key ? 'var(--accent2)' : 'var(--text2)',
            borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: -1, transition: 'all 0.15s', fontWeight: tab === t.key ? 600 : 400
          }}>{t.label}</button>
        ))}
      </div>

      {/* Board view */}
      {tab === 'board' && (
        <KanbanBoard tasks={tasks} role={role} userId={user.id}
          onUpdate={refreshTasks}
          onEdit={t => { setEditTask(t); setShowTask(true); }}
          onDetail={t => setShowDetail(t)}
        />
      )}

      {/* List view */}
      {tab === 'list' && (
        <ListView tasks={tasks} role={role} userId={user.id}
          onUpdate={refreshTasks}
          onEdit={t => { setEditTask(t); setShowTask(true); }}
          onDetail={t => setShowDetail(t)}
        />
      )}

      {/* Members */}
      {tab === 'members' && (
        <MembersTab members={members} projectId={id} adminId={project.adminId}
          role={role} onUpdated={fetchProject} />
      )}

      {/* Create/Edit Task Modal */}
      <TaskModal
        open={showTask}
        onClose={() => { setShowTask(false); setEditTask(null); }}
        projectId={id}
        members={members}
        task={editTask}
        onSaved={async () => { setShowTask(false); setEditTask(null); await refreshTasks(); }}
        role={role}
      />

      {/* Add Member Modal */}
      <AddMemberModal
        open={showMember}
        onClose={() => setShowMember(false)}
        projectId={id}
        onAdded={fetchProject}
      />

      {/* Task Detail Modal */}
      {showDetail && (
        <TaskDetailModal
          task={showDetail}
          members={members}
          role={role}
          userId={user.id}
          onClose={() => setShowDetail(null)}
          onUpdated={async (updated) => { setShowDetail(updated); await refreshTasks(); }}
          onDeleted={async () => { setShowDetail(null); await refreshTasks(); }}
        />
      )}
    </div>
  );
}

// ─── KANBAN BOARD ──────────────────────────────────────────────────────────────
function KanbanBoard({ tasks, role, userId, onUpdate, onEdit, onDetail }) {
  const updateStatus = async (taskId, status) => {
    try { await api.patch(`/tasks/${taskId}`, { status }); await onUpdate(); } catch {}
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
      {STATUSES.map(col => {
        const colTasks = tasks.filter(t => t.status === col.key);
        return (
          <div key={col.key} style={{
            background: 'var(--bg2)', borderRadius: 12,
            border: '1px solid var(--border)', overflow: 'hidden'
          }}>
            <div style={{
              padding: '14px 16px', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', borderBottom: '1px solid var(--border)',
              background: col.bg
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: col.color }}>{col.label}</span>
              <span style={{
                background: col.color, color: '#000', fontSize: 11,
                fontWeight: 700, borderRadius: '50%', width: 20, height: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>{colTasks.length}</span>
            </div>
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 120 }}>
              {colTasks.map(t => (
                <TaskCard key={t.id} task={t} role={role} userId={userId}
                  onStatusChange={status => updateStatus(t.id, status)}
                  onEdit={() => onEdit(t)}
                  onDetail={() => onDetail(t)}
                />
              ))}
              {colTasks.length === 0 && (
                <div style={{ color: 'var(--text2)', fontSize: 12, textAlign: 'center', padding: '20px 0', opacity: 0.5 }}>
                  No tasks
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TaskCard({ task, role, userId, onStatusChange, onEdit, onDetail }) {
  const overdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  const canEdit = role === 'admin' || task.assigneeId === userId;

  return (
    <div onClick={() => onDetail()} style={{
      background: 'var(--bg3)', borderRadius: 8, padding: '12px',
      border: `1px solid ${overdue ? 'rgba(255,95,109,0.3)' : 'var(--border)'}`,
      cursor: 'pointer', transition: 'all 0.15s'
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = overdue ? 'rgba(255,95,109,0.3)' : 'var(--border)'; e.currentTarget.style.transform = ''; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{task.title}</span>
        <span className={`badge badge-${task.priority}`} style={{ fontSize: 10, flexShrink: 0, padding: '2px 7px' }}>{task.priority}</span>
      </div>
      {task.description && (
        <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10, lineHeight: 1.4,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {task.description}
        </p>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
        {task.assigneeName ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              background: 'var(--accent)', fontSize: 9, fontWeight: 700,
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {task.assigneeName[0].toUpperCase()}
            </div>
            <span style={{ fontSize: 11, color: 'var(--text2)' }}>{task.assigneeName}</span>
          </div>
        ) : <span style={{ fontSize: 11, color: 'var(--text2)' }}>Unassigned</span>}
        {task.dueDate && (
          <span style={{ fontSize: 10, color: overdue ? 'var(--red)' : 'var(--text2)' }}>
            {overdue ? '⚠ ' : ''}{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
      {canEdit && (
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          {STATUSES.filter(s => s.key !== task.status).map(s => (
            <button key={s.key} onClick={e => { e.stopPropagation(); onStatusChange(s.key); }}
              style={{
                flex: 1, padding: '4px 0', fontSize: 10, borderRadius: 4,
                background: s.bg, color: s.color, border: `1px solid ${s.color}30`,
                transition: 'opacity 0.15s'
              }}>
              → {s.label}
            </button>
          ))}
          {role === 'admin' && (
            <button onClick={e => { e.stopPropagation(); onEdit(); }}
              style={{ padding: '4px 8px', fontSize: 10, borderRadius: 4, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text2)' }}>
              ✏
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── LIST VIEW ─────────────────────────────────────────────────────────────────
function ListView({ tasks, role, userId, onUpdate, onEdit, onDetail }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const updateStatus = async (taskId, status) => {
    try { await api.patch(`/tasks/${taskId}`, { status }); await onUpdate(); } catch {}
  };

  const filtered = tasks.filter(t => {
    const matchFilter = filter === 'all' || t.status === filter;
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input placeholder="🔍 Search tasks..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 240 }} />
        <div style={{ display: 'flex', gap: 4 }}>
          {[{ key: 'all', label: 'All' }, ...STATUSES].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '8px 14px', borderRadius: 8, fontSize: 13,
              background: filter === f.key ? 'var(--accent)' : 'var(--bg3)',
              color: filter === f.key ? '#fff' : 'var(--text2)',
              border: '1px solid var(--border)', transition: 'all 0.15s'
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text2)', fontSize: 14 }}>No tasks match this filter.</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                {['Task', 'Assignee', 'Status', 'Priority', 'Due Date', role === 'admin' ? 'Actions' : ''].map((h, i) => h && (
                  <th key={i} style={{ textAlign: 'left', padding: '11px 14px', fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(task => {
                const overdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
                const canEdit = role === 'admin' || task.assigneeId === userId;
                return (
                  <tr key={task.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ padding: '12px 14px', cursor: 'pointer' }} onClick={() => onDetail(task)}>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{task.title}</div>
                      {task.description && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{task.description.slice(0, 60)}{task.description.length > 60 ? '…' : ''}</div>}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {task.assigneeName ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13 }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {task.assigneeName[0].toUpperCase()}
                          </div>
                          {task.assigneeName}
                        </div>
                      ) : <span style={{ fontSize: 12, color: 'var(--text2)' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {canEdit ? (
                        <select value={task.status}
                          onChange={e => { e.stopPropagation(); updateStatus(task.id, e.target.value); }}
                          style={{ width: 'auto', padding: '4px 8px', fontSize: 12 }}>
                          <option value="todo">To Do</option>
                          <option value="inprogress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
                      ) : (
                        <span className={`badge badge-${task.status}`}>
                          {task.status === 'todo' ? 'To Do' : task.status === 'inprogress' ? 'In Progress' : 'Done'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: overdue ? 'var(--red)' : 'var(--text2)' }}>
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      {overdue && ' ⚠'}
                    </td>
                    {role === 'admin' && (
                      <td style={{ padding: '12px 14px' }}>
                        <button className="btn btn-ghost btn-sm" style={{ padding: '4px 10px' }}
                          onClick={() => onEdit(task)}>Edit</button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── MEMBERS TAB ───────────────────────────────────────────────────────────────
function MembersTab({ members, projectId, adminId, role, onUpdated }) {
  const removeMember = async (uid) => {
    if (!confirm('Remove this member?')) return;
    try { await api.delete(`/projects/${projectId}/members/${uid}`); onUpdated(); } catch (e) { alert(e.message); }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {members.map((m, i) => (
          <div key={m.id} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 20px',
            borderBottom: i < members.length - 1 ? '1px solid var(--border)' : 'none'
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: `hsl(${m.name.charCodeAt(0) * 30}, 55%, 50%)`,
              color: '#fff', fontSize: 14, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>{m.name[0].toUpperCase()}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{m.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{m.email}</div>
            </div>
            <span className={`badge badge-${m.role}`}>{m.role}</span>
            {role === 'admin' && m.id !== adminId && (
              <button onClick={() => removeMember(m.id)} className="btn btn-danger btn-sm">Remove</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ADD MEMBER MODAL ──────────────────────────────────────────────────────────
function AddMemberModal({ open, onClose, projectId, onAdded }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const res = await api.post(`/projects/${projectId}/members`, { email });
      setSuccess(`${res.user.name} added!`);
      setEmail('');
      onAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={() => { onClose(); setError(''); setSuccess(''); }} title="Add Team Member">
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>
        Enter the email address of an existing TaskFlow user to add them to this project.
      </p>
      <form onSubmit={handleAdd}>
        <div className="form-group">
          <label>Email Address</label>
          <input type="email" placeholder="colleague@company.com" value={email}
            onChange={e => setEmail(e.target.value)} autoFocus required />
        </div>
        {error && <p className="error-msg">{error}</p>}
        {success && <p className="success-msg">✓ {success}</p>}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Done</button>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
            {loading ? <span className="spinner" /> : 'Add Member'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── TASK FORM MODAL ───────────────────────────────────────────────────────────
function TaskModal({ open, onClose, projectId, members, task, onSaved, role }) {
  const isEdit = !!task;
  const [form, setForm] = useState({ title: '', description: '', dueDate: '', priority: 'medium', status: 'todo', assigneeId: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        priority: task.priority || 'medium',
        status: task.status || 'todo',
        assigneeId: task.assigneeId || '',
      });
    } else {
      setForm({ title: '', description: '', dueDate: '', priority: 'medium', status: 'todo', assigneeId: '' });
    }
    setError('');
  }, [task, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        assigneeId: form.assigneeId || null,
        dueDate: form.dueDate || null,
      };
      if (isEdit) {
        await api.patch(`/tasks/${task.id}`, payload);
      } else {
        await api.post(`/tasks/project/${projectId}`, payload);
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const f = (key) => ({ value: form[key], onChange: e => setForm(p => ({ ...p, [key]: e.target.value })) });

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Task' : 'Create Task'}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title *</label>
          <input autoFocus placeholder="Task title..." required {...f('title')} />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea rows={3} placeholder="Optional details..." style={{ resize: 'vertical' }} {...f('description')} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label>Priority</label>
            <select {...f('priority')}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select {...f('status')}>
              <option value="todo">To Do</option>
              <option value="inprogress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label>Due Date</label>
            <input type="date" {...f('dueDate')} />
          </div>
          <div className="form-group">
            <label>Assign To</label>
            <select {...f('assigneeId')}>
              <option value="">Unassigned</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        </div>
        {error && <p className="error-msg">{error}</p>}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
            {loading ? <span className="spinner" /> : isEdit ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── TASK DETAIL MODAL ─────────────────────────────────────────────────────────
function TaskDetailModal({ task, members, role, userId, onClose, onUpdated, onDeleted }) {
  const [status, setStatus] = useState(task.status);
  const [saving, setSaving] = useState(false);
  const overdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  const canEdit = role === 'admin' || task.assigneeId === userId;

  const updateStatus = async (s) => {
    setSaving(true);
    try {
      const updated = await api.patch(`/tasks/${task.id}`, { status: s });
      setStatus(s);
      onUpdated({ ...task, status: s });
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const deleteTask = async () => {
    if (!confirm('Delete this task?')) return;
    try { await api.delete(`/tasks/${task.id}`); onDeleted(); } catch (e) { alert(e.message); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 520 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 17, lineHeight: 1.4 }}>{task.title}</h3>
          <button onClick={onClose} style={{ background: 'none', color: 'var(--text2)', fontSize: 20, padding: '2px 6px', borderRadius: 6, flexShrink: 0 }}>×</button>
        </div>

        {task.description && (
          <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 20, lineHeight: 1.6 }}>{task.description}</p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priority</div>
            <span className={`badge badge-${task.priority}`}>{task.priority}</span>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</div>
            <span className={`badge badge-${status}`}>
              {status === 'todo' ? 'To Do' : status === 'inprogress' ? 'In Progress' : 'Done'}
            </span>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assignee</div>
            <div style={{ fontSize: 14 }}>{task.assigneeName || <span style={{ color: 'var(--text2)' }}>Unassigned</span>}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Due Date</div>
            <div style={{ fontSize: 14, color: overdue ? 'var(--red)' : 'var(--text)' }}>
              {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
              {overdue && ' ⚠ Overdue'}
            </div>
          </div>
        </div>

        {canEdit && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Update Status</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {STATUSES.map(s => (
                <button key={s.key} onClick={() => updateStatus(s.key)} disabled={saving || status === s.key}
                  style={{
                    flex: 1, padding: '8px', fontSize: 12, borderRadius: 8,
                    background: status === s.key ? s.bg : 'var(--bg3)',
                    color: status === s.key ? s.color : 'var(--text2)',
                    border: `1px solid ${status === s.key ? s.color + '50' : 'var(--border)'}`,
                    transition: 'all 0.15s', fontWeight: status === s.key ? 600 : 400
                  }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 20, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          Created {new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          {task.updatedAt !== task.createdAt && ` · Updated ${new Date(task.updatedAt).toLocaleDateString()}`}
        </div>

        {role === 'admin' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-danger btn-sm" onClick={deleteTask}>🗑 Delete Task</button>
          </div>
        )}
      </div>
    </div>
  );
}
