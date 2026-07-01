import React, { useState, useEffect } from 'react';
import { donorAPI, recipientAPI, donationAPI, requestAPI } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, CartesianGrid
} from 'recharts';
import '../styles/Reports.css';

const PIE_COLORS = ['#e63946', '#f4a261', '#8338ec', '#2a9d8f', '#c1121f', '#e76f51', '#5a189a', '#264653'];

export default function Reports() {
  const [data, setData] = useState({ donors: [], recipients: [], donations: [], requests: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [d, r, don, req] = await Promise.all([
        donorAPI.getAll(), recipientAPI.getAll(), donationAPI.getAll(), requestAPI.getAll()
      ]);
      setData({ donors: d.data, recipients: r.data, donations: don.data, requests: req.data });
    } catch { setError('Xogta Reports la soo qaadi kari waayay.'); }
    finally { setLoading(false); }
  };

  // ---- computed stats ----
  const totalDonatedML = data.donations.reduce((s, d) => s + (d.quantityML || 0), 0);
  const totalRequestedML = data.requests.reduce((s, r) => s + (r.quantityML || 0), 0);

  const bloodGroupDonors = Object.entries(
    data.donors.reduce((acc, d) => { acc[d.bloodGroup] = (acc[d.bloodGroup] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const bloodGroupRequests = Object.entries(
    data.requests.reduce((acc, r) => { acc[r.bloodGroup] = (acc[r.bloodGroup] || 0) + (r.quantityML || 0); return acc; }, {})
  ).map(([name, ml]) => ({ name, ml }));

  const monthlyDonations = Object.entries(
    data.donations.reduce((acc, d) => {
      const m = new Date(d.donationDate).toLocaleString('default', { month: 'short', year: '2-digit' });
      acc[m] = (acc[m] || 0) + (d.quantityML || 0);
      return acc;
    }, {})
  ).map(([month, ml]) => ({ month, ml }));

  const monthlyRequests = Object.entries(
    data.requests.reduce((acc, r) => {
      const m = new Date(r.requestDate).toLocaleString('default', { month: 'short', year: '2-digit' });
      acc[m] = (acc[m] || 0) + (r.quantityML || 0);
      return acc;
    }, {})
  ).map(([month, ml]) => ({ month, ml }));

  const printReport = () => window.print();

  if (loading) return <div className="page-loading"><div className="loading-pulse">🩸</div><p>Xogta la soo rarayo...</p></div>;

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1>Warbixinnada</h1>
          <span className="page-sub">Reports & Analytics</span>
        </div>
        <button className="btn-print" onClick={printReport}>🖨️ Daabac</button>
      </div>

      {error && <div className="api-error">⚠️ {error}</div>}

      {/* TABS */}
      <div className="report-tabs">
        {['overview', 'donations', 'requests', 'bloodgroups'].map(tab => (
          <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {{ overview: 'Dulmar', donations: 'Deeqaha', requests: 'Codsiyada', bloodgroups: 'Kooxaha Dhiigga' }[tab]}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="report-section">
          <div className="summary-cards">
            <div className="summary-card">
              <div className="s-icon red">👤</div>
              <div><div className="s-val">{data.donors.length}</div><div className="s-lbl">Wadaagayaasha</div></div>
            </div>
            <div className="summary-card">
              <div className="s-icon orange">🏥</div>
              <div><div className="s-val">{data.recipients.length}</div><div className="s-lbl">Qaatayaasha</div></div>
            </div>
            <div className="summary-card">
              <div className="s-icon purple">💉</div>
              <div><div className="s-val">{data.donations.length}</div><div className="s-lbl">Deeqaha</div></div>
            </div>
            <div className="summary-card">
              <div className="s-icon teal">📋</div>
              <div><div className="s-val">{data.requests.length}</div><div className="s-lbl">Codsiyada</div></div>
            </div>
            <div className="summary-card">
              <div className="s-icon crimson">🩸</div>
              <div><div className="s-val">{(totalDonatedML / 1000).toFixed(1)}L</div><div className="s-lbl">Wadarta Deeqaha</div></div>
            </div>
            <div className="summary-card">
              <div className="s-icon amber">📊</div>
              <div><div className="s-val">{(totalRequestedML / 1000).toFixed(1)}L</div><div className="s-lbl">Wadarta Codsiyada</div></div>
            </div>
          </div>

          <div className="report-chart-grid">
            <div className="report-chart-card">
              <h3>Deeqaha vs Codsiyada (ML)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[{ name: 'Deeqaha', ml: totalDonatedML }, { name: 'Codsiyada', ml: totalRequestedML }]}>
                  <XAxis dataKey="name" /><YAxis /><Tooltip /><CartesianGrid strokeDasharray="3 3" />
                  <Bar dataKey="ml" fill="#e63946" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="report-chart-card">
              <h3>Kooxaha Dhiigga — Donors</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={bloodGroupDonors} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {bloodGroupDonors.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % 8]} />)}
                  </Pie>
                  <Legend /><Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* DONATIONS TAB */}
      {activeTab === 'donations' && (
        <div className="report-section">
          <div className="report-chart-card full">
            <h3>Deeqaha Billaha — Qadarka ML</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyDonations}>
                <XAxis dataKey="month" /><YAxis /><Tooltip /><CartesianGrid strokeDasharray="3 3" />
                <Line type="monotone" dataKey="ml" stroke="#e63946" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="report-table-card">
            <h3>Deeqaha Oo Dhan ({data.donations.length})</h3>
            <table className="data-table">
              <thead><tr><th>#</th><th>Donor</th><th>Taariikhda</th><th>Qadarka ML</th></tr></thead>
              <tbody>
                {data.donations.map((d, i) => (
                  <tr key={d.donationID}>
                    <td>{i + 1}</td>
                    <td>{d.donorName || 'N/A'}</td>
                    <td>{d.donationDate ? new Date(d.donationDate).toLocaleDateString() : '—'}</td>
                    <td><span className="ml-badge">{d.quantityML} ml</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REQUESTS TAB */}
      {activeTab === 'requests' && (
        <div className="report-section">
          <div className="report-chart-card full">
            <h3>Codsiyada Billaha — Qadarka ML</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyRequests}>
                <XAxis dataKey="month" /><YAxis /><Tooltip /><CartesianGrid strokeDasharray="3 3" />
                <Line type="monotone" dataKey="ml" stroke="#8338ec" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="report-chart-card full">
            <h3>Codsiyada Koox Walba (ML)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={bloodGroupRequests}>
                <XAxis dataKey="name" /><YAxis /><Tooltip /><CartesianGrid strokeDasharray="3 3" />
                <Bar dataKey="ml" fill="#8338ec" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* BLOOD GROUPS TAB */}
      {activeTab === 'bloodgroups' && (
        <div className="report-section">
          <div className="bg-grid">
            {bloodGroupDonors.map((bg, i) => (
              <div key={bg.name} className="bg-card" style={{ borderColor: PIE_COLORS[i % 8] }}>
                <div className="bg-name" style={{ color: PIE_COLORS[i % 8] }}>{bg.name}</div>
                <div className="bg-count">{bg.value}</div>
                <div className="bg-label">Donors</div>
              </div>
            ))}
          </div>
          <div className="report-chart-card full" style={{ marginTop: '24px' }}>
            <h3>Donors — Koox walba</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={bloodGroupDonors}>
                <XAxis dataKey="name" /><YAxis /><Tooltip /><CartesianGrid strokeDasharray="3 3" />
                <Bar dataKey="value" fill="#e63946" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
