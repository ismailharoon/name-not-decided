import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { usePortal } from './context/PortalContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FlightBookings from './pages/FlightBookings';
import FlightManagement from './pages/FlightManagement';
import FlightPOS from './pages/FlightPOS';
import SegmentManagement from './pages/SegmentManagement';
import ManageSubAgents from './pages/ManageSubAgents';

function ProtectedShell({ children }) {
  const { user } = usePortal();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/Dashboard"
        element={
          <ProtectedShell>
            <Dashboard />
          </ProtectedShell>
        }
      />
      <Route
        path="/FlightBookings"
        element={
          <ProtectedShell>
            <FlightBookings />
          </ProtectedShell>
        }
      />
      <Route
        path="/FlightManagement"
        element={
          <ProtectedShell>
            <FlightManagement />
          </ProtectedShell>
        }
      />
      <Route
        path="/FlightPOS"
        element={
          <ProtectedShell>
            <FlightPOS />
          </ProtectedShell>
        }
      />
      <Route
        path="/SegmentManagement"
        element={
          <ProtectedShell>
            <SegmentManagement />
          </ProtectedShell>
        }
      />
      <Route
        path="/ManageSubAgents"
        element={
          <ProtectedShell>
            <ManageSubAgents />
          </ProtectedShell>
        }
      />
      <Route path="/" element={<Navigate to="/FlightBookings" replace />} />
      <Route path="*" element={<Navigate to="/FlightBookings" replace />} />
    </Routes>
  );
}
