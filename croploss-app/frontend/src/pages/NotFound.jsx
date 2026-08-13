import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🌾</div>
      <h2 style={{ fontFamily: "'Playfair Display',serif", marginBottom: 8 }}>Page Not Found</h2>
      <p style={{ color: 'var(--gray)', marginBottom: 24 }}>The page you are looking for does not exist.</p>
      <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
    </div>
  );
}
