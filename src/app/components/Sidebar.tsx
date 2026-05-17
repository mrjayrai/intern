import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UserPlus,
  Users,
  ClipboardCheck,
  FileText,
  IdCard,
  Key,
  Activity,
  Award,
  BarChart3,
  Sparkles,
  Settings
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', to: '/', icon: LayoutDashboard },
  { name: 'Referrals', to: '/referrals', icon: UserPlus },
  { name: 'Candidates', to: '/candidates', icon: Users },
  { name: 'Onboarding', to: '/onboarding', icon: ClipboardCheck },
  { name: 'NDA & Documents', to: '/documents', icon: FileText },
  { name: 'Non-Worker IDs', to: '/ids', icon: IdCard },
  { name: 'Access Management', to: '/access', icon: Key },
  { name: 'Internship Tracking', to: '/tracking', icon: Activity },
  { name: 'Certificates', to: '/certificates', icon: Award },
  { name: 'Reports', to: '/reports', icon: BarChart3 },
  { name: 'AI Assistant', to: '/ai-assistant', icon: Sparkles },
  { name: 'Settings', to: '/settings', icon: Settings },
];

export function Sidebar() {
  return (
    <div className="flex h-full w-64 flex-col bg-[#1e293b] text-white">
      <div className="flex h-16 items-center justify-center border-b border-[#334155] px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6]">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Intern Flow</h1>
            <p className="text-xs text-slate-400">AI-Powered Platform</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-[#3b82f6] text-white'
                  : 'text-slate-300 hover:bg-[#334155] hover:text-white'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-[#334155] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3b82f6]">
            <span className="text-sm font-semibold">JD</span>
          </div>
          <div>
            <p className="text-sm font-medium">John Doe</p>
            <p className="text-xs text-slate-400">Program Manager</p>
          </div>
        </div>
      </div>
    </div>
  );
}
