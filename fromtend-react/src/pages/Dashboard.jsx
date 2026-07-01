import React, { useState, useEffect } from 'react';
import { donorAPI, recipientAPI, donationAPI, requestAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import '../styles/Dashboard.css';

const BLOOD_COLORS = {
  'A+': '#e63946', 'A-': '#c1121f', 'B+': '#f4a261',
  'B-': '#e76f51', 'AB+': '#8338ec', 'AB-': '#5a189a',
  'O+': '#2a9d8f', 'O-': '#264653',
};

const PIE_COLORS = ['#e63946', '#f4a261', '#8338ec', '#2a9d8f', '#c1121f', '#e76f51', '#5a189a', '#264653'];

export default function Dashboard() {
  const [stats, setStats] = useState({
    donors: 0, recipients: 0, donations: 0, requests: 0, totalBloodML: 0
  });
  const [bloodGroupData, setBloodGroupData] = useState([]);
  const [donationTrend, setDonationTrend] = useState([]);
  const [recentDonations, setRecentDonations] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [donors, recipients, donations, requests] = await Promise.all([
        donorAPI.getAll(),
        recipientAPI.getAll(),
        donationAPI.getAll(),
        requestAPI.getAll(),
      ]);

      const donorList = donors.data;
      const recipientList = recipients.data;
      const donationList = donations.data;
      const requestList = requests.data;

      const totalML = donationList.reduce((sum, d) => sum + (d.quantityML || 0), 0);

      // Blood group distribution from donors
      const bgCount = {};
      donorList.forEach(d => {
        bgCount[d.bloodGroup] = (bgCount[d.bloodGroup] || 0) + 1;
      });
      const bgData = Object.entries(bgCount).map(([name, value]) => ({ name, value }));

      // Donation trend (last 6 months by month)
      const monthMap = {};
      donationList.forEach(d => {
        const month = new Date(d.donationDate).toLocaleString('default', { month: 'short', year: '2-digit' });
        monthMap[month] = (monthMap[month] || 0) + 1;
      });
      const trend = Object.entries(monthMap).slice(-6).map(([month, count]) => ({ month, count }));

      setStats({
        donors: donorList.length,
        recipients: recipientList.length,
        donations: donationList.length,
        requests: requestList.length,
        totalBloodML: totalML,
      });
      setBloodGroupData(bgData);
      setDonationTrend(trend);
      setRecentDonations(donationList.slice(-5).reverse());
      setRecentRequests(requestList.slice(-5).reverse());
    } catch (err) {
      setError('Backend-ka xiriir la\'aanta ayaa jirta. Hubi C# API-ga inuu shaqeynayo localhost:5000');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="page-loading">
      <div className="loading-pulse">🩸</div>
      <p>Xogta la soo rarayo...</p>
    </div>
  );

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <span className="page-sub">Dulmar guud oo nidaamka</span>
      </div>

      {error && (
        <div className="api-error">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* STAT CARDS */}
      <div className="stats-grid">
        <div className="stat-card red">
          <div className="stat-icon">👤</div>
          <div className="stat-info">
            <span className="stat-value">{stats.donors}</span>
            <span className="stat-name">Wadaagayaasha (Donors)</span>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon">🏥</div>
          <div className="stat-info">
            <span className="stat-value">{stats.recipients}</span>
            <span className="stat-name">Qaatayaasha (Recipients)</span>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon">💉</div>
          <div className="stat-info">
            <span className="stat-value">{stats.donations}</span>
            <span className="stat-name">Deeqaha Dhiigga</span>
          </div>
        </div>
        <div className="stat-card teal">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <span className="stat-value">{stats.requests}</span>
            <span className="stat-name">Codsiyada Dhiigga</span>
          </div>
        </div>
        <div className="stat-card crimson">
          <div className="stat-icon">🩸</div>
          <div className="stat-info">
            <span className="stat-value">{(stats.totalBloodML / 1000).toFixed(1)}L</span>
            <span className="stat-name">Wadarta Dhiigga</span>
          </div>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Kooxaha Dhiigga (Blood Groups)</h3>
          {bloodGroupData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={bloodGroupData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {bloodGroupData.map((entry, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">Xog ma jirto weli</div>
          )}
        </div>

        <div className="chart-card">
          <h3>Deeqaha Billaha (Donation Trend)</h3>
          {donationTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={donationTrend}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#e63946" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">Xog ma jirto weli</div>
          )}
        </div>
      </div>

      {/* RECENT ACTIVITY */}
      <div className="recent-grid">
        <div className="recent-card">
          <h3>Deeqaha Dambe</h3>
          {recentDonations.length > 0 ? (
            <table className="mini-table">
              <thead>
                <tr><th>Magac</th><th>Taarikh</th><th>ML</th></tr>
              </thead>
              <tbody>
                {recentDonations.map(d => (
                  <tr key={d.donationID}>
                    <td>{d.donorName || 'N/A'}</td>
                    <td>{new Date(d.donationDate).toLocaleDateString()}</td>
                    <td><span className="badge red">{d.quantityML} ml</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="no-data">Weli deeq ma jirto</div>
          )}
        </div>

        <div className="recent-card">
          <h3>Codsiyada Dambe</h3>
          {recentRequests.length > 0 ? (
            <table className="mini-table">
              <thead>
                <tr><th>Magac</th><th>Koox</th><th>ML</th></tr>
              </thead>
              <tbody>
                {recentRequests.map(r => (
                  <tr key={r.requestID}>
                    <td>{r.recipientName || 'N/A'}</td>
                    <td><span className="badge purple">{r.bloodGroup}</span></td>
                    <td>{r.quantityML} ml</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="no-data">Weli codsi ma jirto</div>
          )}
        </div>
      </div>
    </div>
  );
}
