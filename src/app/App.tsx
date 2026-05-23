import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RoleRoute } from './components/auth/RoleRoute';
import { Toaster } from './components/ui/sonner';
import { initializeAuthState } from './lib/api';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Referrals } from './pages/Referrals';
import { Candidates } from './pages/Candidates';
import { Onboarding } from './pages/Onboarding';
import { Documents } from './pages/Documents';
import { IDs } from './pages/IDs';
import { Tracking } from './pages/Tracking';
import { Access } from './pages/Access';
import { Certificates } from './pages/Certificates';
import { Reports } from './pages/Reports';
import { AIAssistant } from './pages/AIAssistant';
import { Placeholder } from './pages/Placeholder';

export default function App() {
  useEffect(() => {
    initializeAuthState();
  }, []);

  return (
    <BrowserRouter>
      <Toaster richColors position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/referrals" element={<Referrals />} />
            <Route path="/candidates" element={<Candidates />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/documents" element={<Documents />} />
            <Route
              element={
                <RoleRoute allowedRoles={['superAdmin', 'hr', 'it']} />
              }
            >
              <Route path="/ids" element={<IDs />} />
              <Route path="/access" element={<Access />} />
            </Route>
            <Route path="/tracking" element={<Tracking />} />
            <Route path="/certificates" element={<Certificates />} />
            <Route
              element={
                <RoleRoute allowedRoles={['superAdmin', 'hr', 'compliance']} />
              }
            >
              <Route path="/reports" element={<Reports />} />
            </Route>
            <Route path="/ai-assistant" element={<AIAssistant />} />
            <Route
              element={
                <RoleRoute allowedRoles={['superAdmin']} />
              }
            >
              <Route
                path="/settings"
                element={
                  <Placeholder
                    title="Settings"
                    description="Platform configuration and governance coming soon"
                  />
                }
              />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
