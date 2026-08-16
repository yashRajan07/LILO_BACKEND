import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UserRound,
  BookOpen,
  Activity,
  Sparkles,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/child-profile', label: 'Child Profile', icon: UserRound },
  { to: '/learning-controls', label: 'Learning', icon: BookOpen },
  { to: '/reports', label: 'Activity', icon: Activity },
];

export default function Sidebar() {
  return (
    <aside className="sidebar-bg fixed top-0 left-0 h-screen w-64 flex flex-col z-50 border-r border-[#2d241f] text-[#f7f2eb]">
      {/* Brand Header */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#593d2a] flex items-center justify-center shadow-md">
          <Sparkles className="w-5 h-5 text-[#f7f2eb]" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-[#f7f2eb]">LILO</h1>
          <p className="text-[10px] text-[#978777] font-semibold tracking-wider uppercase">PARENT PORTAL</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 mt-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-[#4a362a] text-[#f7f2eb] shadow-md'
                  : 'text-[#978777] hover:text-[#f7f2eb] hover:bg-[#27201b]'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 mx-4 mb-5 rounded-xl bg-[#27201b] border border-[rgba(196,164,130,0.1)]">
        <p className="text-[11px] text-[#978777] text-center font-medium">LILO Companion Toy v1.0</p>
      </div>
    </aside>
  );
}
