import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) { setError('Please enter email and password.'); return; }
    setLoading(true);
    try {
      await login(form.email.trim().toLowerCase(), form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg,#0a2e0b 0%,#2e7d32 50%,#1b6b1e 100%)', padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 14, padding: 36, width: '100%', maxWidth: 420,
        boxShadow: '0 20px 60px rgba(0,0,0,.3)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 42, marginBottom: 10 }}>🌾</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, color: 'var(--g8)', marginBottom: 4 }}>
            CropLoss Portal
          </h1>
          <p style={{ fontSize: 12, color: 'var(--gray)' }}>ICAR – Indian Institute of Oilseeds Research, Hyderabad</p>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
            {['🌿 Castor','🌻 Sunflower','🌼 Safflower','🌱 Sesame','🍃 Niger','🌾 Linseed'].map(c => (
              <span key={c} style={{ background: 'var(--g1)', color: 'var(--g8)', borderRadius: 20, padding: '2px 9px', fontSize: 10.5, fontWeight: 600 }}>{c}</span>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label required">Email Address</label>
            <input
              className="form-control"
              type="email"
              placeholder="you@icar.gov.in"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              autoComplete="email"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label required">Password</label>
            <input
              className="form-control"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div style={{ background: 'var(--red-l)', border: '1px solid #fca5a5', borderRadius: 7, padding: '8px 12px', fontSize: 12.5, color: 'var(--red-d)' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ padding: 11, justifyContent: 'center', fontSize: 14, marginTop: 4 }}
          >
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        {/* Demo credentials */}
        <div style={{ marginTop: 20, padding: '10px 14px', background: 'var(--g0)', border: '1px solid var(--g1)', borderRadius: 8, fontSize: 11.5, color: 'var(--g8)', lineHeight: 1.9 }}>
          <strong>Demo accounts:</strong><br />
          admin@icar.gov.in / Admin@2025 — Super Admin<br />
          head@icar.gov.in&nbsp; / Head@2025 — Crop Head<br />
          user@center.in&nbsp;&nbsp; / User@2025 — Center User
        </div>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}
