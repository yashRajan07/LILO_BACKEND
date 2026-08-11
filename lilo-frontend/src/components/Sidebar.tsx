import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UserRound,
  BookOpen,
  Clock,
  BarChart3,
  Sparkles,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/child-profile', label: 'Child Profile', icon: UserRound },
  { to: '/learning-controls', label: 'Learning', icon: BookOpen },
  { to: '/schedules', label: 'Schedules', icon: Clock },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
];

export default function Sidebar() {
  return (
    <aside className="glass-sidebar fixed top-0 left-0 h-screen w-64 flex flex-col z-50">
      {/* Brand Header */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lilo-500 to-lilo-700 flex items-center justify-center shadow-lg">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-text-primary tracking-tight">LILO</h1>
          <p className="text-[11px] text-text-muted font-medium tracking-wider uppercase">Parent Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 mt-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 mb-1 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-lilo-600/15 text-lilo-300 shadow-sm border border-lilo-600/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-lighter/50'
              }`
            }
          >
            <item.icon className="w-[18px] h-[18px]" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 mx-3 mb-4 rounded-xl bg-surface-lighter/30 border border-glass-border">
        <p className="text-[11px] text-text-muted text-center">LILO Companion Toy v1.0</p>
      </div>
    </aside>
  );
}
