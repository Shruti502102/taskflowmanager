import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { to: '/projects',  icon: '◈', label: 'Projects'  },
  { to: '/tasks',     icon: '✓', label: 'My Tasks'  },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const doLogout = () => { logout(); navigate('/'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 64 : 220,
        background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.25s ease',
        flexShrink: 0,
        position: 'sticky', top: 0, height: '100vh'
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? '20px 0' : '20px 20px',
          display: 'flex', alignItems: 'center',
          gap: 10, borderBottom: '1px solid var(--border)',
          justifyContent: collapsed ? 'center' : 'space-between'
        }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{
                width: 32, height: 32, background: 'var(--accent)',
                borderRadius: 8, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 16, flexShrink: 0
              }}>⚡</div>
              <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 17, letterSpacing: '-0.3px' }}>
                TaskFlow
              </span>
            </div>
          )}
          {collapsed && (
            <div style={{
              width: 32, height: 32, background: 'var(--accent)',
              borderRadius: 8, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 16
            }}>⚡</div>
          )}
          {!collapsed && (
            <button onClick={() => setCollapsed(true)} style={{
              background: 'none', color: 'var(--text2)', fontSize: 16, padding: 4,
              borderRadius: 6, lineHeight: 1
            }}>←</button>
          )}
        </div>

        {collapsed && (
          <button onClick={() => setCollapsed(false)} style={{
            background: 'none', color: 'var(--text2)', fontSize: 14,
            padding: '10px 0', textAlign: 'center', borderBottom: '1px solid var(--border)'
          }}>→</button>
        )}

        {/* Nav links */}
        <nav style={{ padding: '12px 8px', flex: 1 }}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center',
              gap: 10, padding: collapsed ? '11px 0' : '11px 12px',
              borderRadius: 8, marginBottom: 2,
              background: isActive ? 'rgba(108,99,255,0.15)' : 'transparent',
              color: isActive ? 'var(--accent2)' : 'var(--text2)',
              fontWeight: isActive ? 500 : 400,
              fontSize: 14, transition: 'all 0.15s',
              justifyContent: collapsed ? 'center' : 'flex-start',
              textDecoration: 'none',
            })}>
              <span style={{ fontSize: 17, lineHeight: 1 }}>{icon}</span>
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>

        {/* User area */}
        <div style={{
          padding: collapsed ? '12px 0' : '12px',
          borderTop: '1px solid var(--border)',
        }}>
          {!collapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0
              }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.email}
                </div>
              </div>
              <button onClick={doLogout} title="Logout" style={{
                background: 'none', color: 'var(--text2)', fontSize: 15, padding: 4,
                borderRadius: 6, flexShrink: 0
              }}>⏏</button>
            </div>
          ) : (
            <button onClick={doLogout} title="Logout" style={{
              background: 'none', color: 'var(--text2)', fontSize: 16,
              padding: '6px 0', display: 'flex', justifyContent: 'center', width: '100%'
            }}>⏏</button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
