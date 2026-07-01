import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const result = login(form.username, form.password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message);
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand">
          <div className="brand-icon">🩸</div>
          <h1>BloodBank <span>MS</span></h1>
          <p>Blood Donation Management System</p>
        </div>
        <div className="login-stats">
          <div className="stat-item">
            <span className="stat-num">2,400+</span>
            <span className="stat-label">Donors registered</span>
          </div>
          <div className="stat-item">
            <span className="stat-num">8</span>
            <span className="stat-label">Blood groups tracked</span>
          </div>
          <div className="stat-item">
            <span className="stat-num">1,800+</span>
            <span className="stat-label">Lives impacted</span>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <div className="login-header">
            <h2>Soo Gal</h2>
            <p>Xisaabta admin u geli macluumaadkaaga</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                placeholder="admin"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            {error && <div className="error-box">{error}</div>}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <span className="spinner"></span>
              ) : (
                'Gal →'
              )}
            </button>
          </form>

          <div className="login-hint">
            <span>Demo: admin / admin123</span>
          </div>
        </div>
      </div>
    </div>
  );
}
