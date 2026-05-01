import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await signup(form.name, form.email, form.password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 30% 20%, rgba(108,99,255,0.12) 0%, transparent 60%), var(--bg)',
      padding: '20px'
    }}>
      {/* Logo */}
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 8
          }}>
            <div style={{
              width: 40, height: 40, background: 'var(--accent)',
              borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20
            }}>⚡</div>
            <span style={{ fontFamily: 'Syne', fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>
              TaskFlow
            </span>
          </div>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>Team collaboration, simplified.</p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          {/* Tab */}
          <div style={{
            display: 'flex', background: 'var(--bg)', borderRadius: 8,
            padding: 4, marginBottom: 28, border: '1px solid var(--border)'
          }}>
            {['login', 'signup'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                style={{
                  flex: 1, padding: '8px', borderRadius: 6, fontSize: 14, fontWeight: 500,
                  background: mode === m ? 'var(--accent)' : 'transparent',
                  color: mode === m ? '#fff' : 'var(--text2)',
                  transition: 'all 0.2s', textTransform: 'capitalize'
                }}>
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" placeholder="Jane Smith" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
            )}
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="you@company.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            {error && <p className="error-msg" style={{ marginBottom: 12 }}>⚠ {error}</p>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} disabled={loading}>
              {loading ? <span className="spinner" /> : mode === 'login' ? 'Sign In →' : 'Create Account →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text2)' }}>
          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
            style={{ background: 'none', color: 'var(--accent2)', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
