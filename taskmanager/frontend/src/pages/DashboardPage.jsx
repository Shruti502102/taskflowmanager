import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: -10, right: -10,
        width: 60, height: 60, borderRadius: '50%',
        background: color, opacity: 0.12
      }} />
      <div style={{ fontSize: 26, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 32, fontFamily: 'Syne', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function BarChart({ data, total }) {
  if (!total) return <div style={{ color: 'var(--text2)', fontSize: 13, padding: '20px 0' }}>No tasks yet</div>;
  const bars = [
    { key: 'todo', label: 'To Do', color: 'var(--text2)', val: data.todo },
    { key: 'inprogress', label: 'In Progress', color: 'var(--yellow)', val: data.inprogress },
    { key: 'done', label: 'Done', color: 'var(--green)', val: data.done },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {bars.map(b => (
        <div key={b.key}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
            <span style={{ color: 'var(--text2)' }}>{b.label}</span>
            <span style={{ color: b.color, fontWeight: 600 }}>{b.val}</span>
          </div>
          <div style={{ height: 8, background: 'var(--bg)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${total ? (b.val / total) * 100 : 0}%`,
              background: b.color, borderRadius: 4,
              transition: 'width 0.6s ease', minWidth: b.val > 0 ? 4 : 0
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard').then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <span className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
          {greeting}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>
          Here's what's happening across your projects.
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard icon="📋" label="Total Tasks" value={stats?.total ?? 0} color="var(--accent2)" />
        <StatCard icon="⚡" label="In Progress" value={stats?.byStatus?.inprogress ?? 0} color="var(--yellow)" />
        <StatCard icon="✅" label="Completed" value={stats?.byStatus?.done ?? 0} color="var(--green)" />
        <StatCard icon="⚠️" label="Overdue" value={stats?.overdue ?? 0} color="var(--red)" />
        <StatCard icon="◈" label="Projects" value={stats?.projects ?? 0} color="var(--accent)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Status breakdown */}
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 20 }}>Tasks by Status</h3>
          <BarChart data={stats?.byStatus ?? {}} total={stats?.total ?? 0} />
        </div>

        {/* Top assignees */}
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 20 }}>Top Assignees</h3>
          {stats?.tasksPerUser?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stats.tasksPerUser.map((u, i) => (
                <div key={u.userId} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: `hsl(${i * 60 + 250}, 60%, 55%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0
                  }}>
                    {u.name?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</div>
                    <div style={{ height: 4, background: 'var(--bg)', borderRadius: 2, marginTop: 4 }}>
                      <div style={{
                        height: '100%', borderRadius: 2,
                        width: `${(u.count / (stats.total || 1)) * 100}%`,
                        background: `hsl(${i * 60 + 250}, 60%, 55%)`,
                        minWidth: 4
                      }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', width: 24, textAlign: 'right' }}>
                    {u.count}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text2)', fontSize: 13 }}>No assigned tasks yet</div>
          )}
        </div>
      </div>

      {/* Recent tasks */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: 15 }}>Recent Tasks</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tasks')}>View all →</button>
        </div>
        {stats?.recentTasks?.length ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Task', 'Status', 'Priority', 'Due Date'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 12px', fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.recentTasks.map(task => {
                const overdue = task.dueDate && new Date(task.dueDate) < now && task.status !== 'done';
                return (
                  <tr key={task.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 12px' }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{task.title}</div>
                      {task.description && (
                        <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {task.description}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <span className={`badge badge-${task.status}`}>
                        {task.status === 'todo' ? 'To Do' : task.status === 'inprogress' ? 'In Progress' : 'Done'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                    </td>
                    <td style={{ padding: '12px 12px', fontSize: 13, color: overdue ? 'var(--red)' : 'var(--text2)' }}>
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      {overdue && <span style={{ marginLeft: 6 }}>⚠</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ color: 'var(--text2)', fontSize: 14, textAlign: 'center', padding: '32px 0' }}>
            No tasks yet. <button className="btn btn-ghost btn-sm" style={{ marginLeft: 8 }} onClick={() => navigate('/projects')}>Create a project →</button>
          </div>
        )}
      </div>
    </div>
  );
}
