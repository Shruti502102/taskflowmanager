import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

const STATUSES = [
  { key: 'todo',       label: 'To Do',       color: 'var(--text2)',  bg: 'rgba(136,136,170,0.1)' },
  { key: 'inprogress', label: 'In Progress',  color: 'var(--yellow)', bg: 'rgba(245,197,66,0.1)' },
  { key: 'done',       label: 'Done',         color: 'var(--green)',  bg: 'rgba(34,211,160,0.1)'  },
];

export default function TasksPage() {
  const [tasks, setTasks]       = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [myTasks, myProjects] = await Promise.all([
        api.get('/tasks/my'),
        api.get('/projects'),
      ]);
      setTasks(myTasks);
      setProjects(myProjects);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const updateStatus = async (taskId, status) => {
    try {
      await api.patch(`/tasks/${taskId}`, { status });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    } catch (e) { alert(e.message); }
  };

  const now = new Date();
  const filtered = tasks.filter(t => {
    if (filter === 'overdue') return t.dueDate && new Date(t.dueDate) < now && t.status !== 'done';
    if (filter !== 'all' && t.status !== filter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getProjectName = (projectId) => projects.find(p => p.id === projectId)?.name || 'Unknown Project';

  const overdueCnt = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done').length;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <span className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  return (
    <div style={{ padding: '32px 36px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>My Tasks</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>All tasks assigned to you across projects</p>
      </div>

      {/* Summary pills */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: 'All', count: tasks.length, color: 'var(--text)' },
          { key: 'todo', label: 'To Do', count: tasks.filter(t => t.status === 'todo').length, color: 'var(--text2)' },
          { key: 'inprogress', label: 'In Progress', count: tasks.filter(t => t.status === 'inprogress').length, color: 'var(--yellow)' },
          { key: 'done', label: 'Done', count: tasks.filter(t => t.status === 'done').length, color: 'var(--green)' },
          { key: 'overdue', label: '⚠ Overdue', count: overdueCnt, color: 'var(--red)' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding: '8px 16px', borderRadius: 20, fontSize: 13,
            background: filter === f.key ? f.color === 'var(--text)' ? 'var(--accent)' : `${f.color}20` : 'var(--bg3)',
            color: filter === f.key ? f.color === 'var(--text)' ? '#fff' : f.color : 'var(--text2)',
            border: filter === f.key ? `1px solid ${f.color === 'var(--text)' ? 'var(--accent)' : f.color}40` : '1px solid var(--border)',
            transition: 'all 0.15s', fontWeight: filter === f.key ? 600 : 400
          }}>
            {f.label} <span style={{ opacity: 0.7, marginLeft: 4 }}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* Search + Priority filter */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input placeholder="🔍 Search tasks..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 240 }} />
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
          style={{ width: 'auto', padding: '8px 12px' }}>
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text2)' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
          <p style={{ fontSize: 15, marginBottom: 8 }}>{tasks.length === 0 ? 'No tasks assigned to you yet.' : 'No tasks match your filters.'}</p>
          {tasks.length === 0 && (
            <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => navigate('/projects')}>
              Browse Projects →
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(task => {
            const overdue = task.dueDate && new Date(task.dueDate) < now && task.status !== 'done';
            return (
              <div key={task.id} className="card" style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
                borderLeft: `3px solid ${overdue ? 'var(--red)' : task.priority === 'high' ? 'var(--red)' : task.priority === 'medium' ? 'var(--yellow)' : 'var(--green)'}`,
                transition: 'transform 0.15s'
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateX(2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = ''}>

                {/* Status toggle */}
                <button onClick={() => updateStatus(task.id, task.status === 'done' ? 'todo' : 'done')} style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${task.status === 'done' ? 'var(--green)' : 'var(--border2)'}`,
                  background: task.status === 'done' ? 'var(--green)' : 'transparent',
                  color: '#fff', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s'
                }}>
                  {task.status === 'done' ? '✓' : ''}
                </button>

                {/* Title + project */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 14, textDecoration: task.status === 'done' ? 'line-through' : 'none', opacity: task.status === 'done' ? 0.5 : 1 }}>
                    {task.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                    <span style={{ cursor: 'pointer', color: 'var(--accent2)' }}
                      onClick={() => navigate(`/projects/${task.projectId}`)}>
                      ◈ {getProjectName(task.projectId)}
                    </span>
                    {task.description && <span style={{ marginLeft: 10 }}>{task.description.slice(0, 50)}{task.description.length > 50 ? '…' : ''}</span>}
                  </div>
                </div>

                {/* Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                  <select value={task.status} onChange={e => updateStatus(task.id, e.target.value)}
                    onClick={e => e.stopPropagation()}
                    style={{ width: 'auto', padding: '4px 8px', fontSize: 12, minWidth: 100 }}>
                    <option value="todo">To Do</option>
                    <option value="inprogress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                  {task.dueDate && (
                    <span style={{ fontSize: 12, color: overdue ? 'var(--red)' : 'var(--text2)', whiteSpace: 'nowrap' }}>
                      {overdue ? '⚠ ' : '📅 '}{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
