import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Layout.css';

const NAV_ITEMS = [
  { path: '/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/donors', icon: '👤', label: 'Donors' },
  { path: '/recipients', icon: '🏥', label: 'Recipients' },
  { path: '/donations', icon: '💉', label: 'Deeqaha' },
  { path: '/requests', icon: '📋', label: 'Codsiyada' },
  { path: '/reports', icon: '📈', label: 'Warbixinnada' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`app-shell ${collapsed ? 'collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-drop">🩸</span>
          {!collapsed && <span className="brand-text">BloodBank<b>MS</b></span>}
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {!collapsed && (
            <div className="user-info">
              <div className="user-avatar">{user?.username?.[0]?.toUpperCase()}</div>
              <div className="user-meta">
                <span className="user-name">{user?.username}</span>
                <span className="user-role">{user?.role}</span>
              </div>
            </div>
          )}
          <button className="logout-btn" onClick={handleLogout} title="Ka bax">
            {collapsed ? '🚪' : '🚪 Ka Bax'}
          </button>
        </div>
      </aside>

      <div className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? '›' : '‹'}
      </div>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
