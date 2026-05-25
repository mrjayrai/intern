import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RoleRoute } from './components/auth/RoleRoute';
import { Toaster } from './components/ui/sonner';
import { initializeAuthState } from './lib/api';
import { ROUTE_PERMISSIONS } from './config/rbac';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import OnboardingAccept from './pages/OnboardingAccept';
import { Dashboard } from './pages/Dashboard';
import { Referrals } from './pages/Referrals';
import { Candidates } from './pages/Candidates';
import { Onboarding } from './pages/Onboarding';
import { OnboardingApprovals } from './pages/OnboardingApprovals';
import { Documents } from './pages/Documents';
import { IDs } from './pages/IDs';
import { Tracking } from './pages/Tracking';
import { Access } from './pages/Access';
import { ReadyToStart } from './pages/ReadyToStart';
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
        <Route path="/register" element={<Register />} />
        <Route path="/onboarding/accept" element={<OnboardingAccept />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route element={<RoleRoute allowedRoles={ROUTE_PERMISSIONS['/']} redirectTo="/onboarding" />}>
              <Route path="/" element={<Dashboard />} />
            </Route>
            <Route path="/referrals" element={<Referrals />} />
            <Route path="/candidates" element={<Candidates />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route element={<RoleRoute allowedRoles={['hr', 'superAdmin']} />}>
              <Route path="/onboarding-approvals" element={<OnboardingApprovals />} />
            </Route>
            <Route path="/documents" element={<Documents />} />
            <Route element={<RoleRoute allowedRoles={ROUTE_PERMISSIONS['/ids']} />}>
              <Route path="/ids" element={<IDs />} />
            </Route>
            <Route element={<RoleRoute allowedRoles={ROUTE_PERMISSIONS['/access']} />}>
              <Route path="/access" element={<Access />} />
            </Route>
            <Route element={<RoleRoute allowedRoles={['hr', 'superAdmin']} />}>
              <Route path="/ready-to-start" element={<ReadyToStart />} />
            </Route>
            <Route path="/tracking" element={<Tracking />} />
            <Route path="/certificates" element={<Certificates />} />
            <Route element={<RoleRoute allowedRoles={ROUTE_PERMISSIONS['/reports']} />}>
              <Route path="/reports" element={<Reports />} />
            </Route>
            <Route path="/ai-assistant" element={<AIAssistant />} />
            <Route element={<RoleRoute allowedRoles={ROUTE_PERMISSIONS['/settings']} />}>
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
