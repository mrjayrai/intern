import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
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
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/referrals" element={<Referrals />} />
          <Route path="/candidates" element={<Candidates />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/ids" element={<IDs />} />
          <Route path="/access" element={<Access />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/certificates" element={<Certificates />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
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
      </Routes>
    </BrowserRouter>
  );
}