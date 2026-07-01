import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Donors from './pages/Donors';
import Recipients from './pages/Recipients';
import BloodDonations from './pages/BloodDonations';
import BloodRequests from './pages/BloodRequests';
import Reports from './pages/Reports';

import './styles/Global.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Protected routes with Layout */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/donors" element={
            <ProtectedRoute>
              <Layout><Donors /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/recipients" element={
            <ProtectedRoute>
              <Layout><Recipients /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/donations" element={
            <ProtectedRoute>
              <Layout><BloodDonations /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/requests" element={
            <ProtectedRoute>
              <Layout><BloodRequests /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              <Layout><Reports /></Layout>
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
