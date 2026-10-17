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

function ProtectedShell({ children, adminOnly = false }) {
  const { user, isSubAgent } = usePortal();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (adminOnly && isSubAgent) {
    return <Navigate to="/FlightPOS" replace />;
  }
  return <Layout>{children}</Layout>;
}

export default function App() {
  const { isSubAgent } = usePortal();

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
        path="/FlightPOS"
        element={
          <ProtectedShell>
            <FlightPOS />
          </ProtectedShell>
        }
      />
      <Route
        path="/FlightBookings"
        element={
          <ProtectedShell adminOnly>
            <FlightBookings />
          </ProtectedShell>
        }
      />
      <Route
        path="/FlightManagement"
        element={
          <ProtectedShell adminOnly>
            <FlightManagement />
          </ProtectedShell>
        }
      />
      <Route
        path="/SegmentManagement"
        element={
          <ProtectedShell adminOnly>
            <SegmentManagement />
          </ProtectedShell>
        }
      />
      <Route
        path="/ManageSubAgents"
        element={
          <ProtectedShell adminOnly>
            <ManageSubAgents />
          </ProtectedShell>
        }
      />
      <Route
        path="/"
        element={<Navigate to={isSubAgent ? '/FlightPOS' : '/FlightBookings'} replace />}
      />
      <Route
        path="*"
        element={<Navigate to={isSubAgent ? '/FlightPOS' : '/FlightBookings'} replace />}
      />
    </Routes>
  );
}
