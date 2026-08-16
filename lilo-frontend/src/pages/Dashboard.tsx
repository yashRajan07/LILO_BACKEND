import { useEffect, useState } from 'react';
import { fetchDashboard } from '../api';
import {
  Calendar as CalendarIcon,
  Bell,
  MoreVertical,
  Radio,
  Cpu,
  Wifi,
  Sparkles,
  Bot,
  Clock,
} from 'lucide-react';

interface DashboardData {
  child_name: string;
  today_hours: string;
  daily_limit_minutes: number;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>({
    child_name: 'Aarav',
    today_hours: '4h 32m',
    daily_limit_minutes: 60,
  });

  useEffect(() => {
    fetchDashboard()
      .then((res) => {
        if (res.child_name) {
          setData((prev) => ({ ...prev, child_name: res.child_name }));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-3xl font-bold text-[#231c18] tracking-tight">
            Welcome back, {data.child_name}!
          </h1>
          <p className="text-sm font-medium text-[#76685c] mt-0.5">LILO AI Voice Companion Portal</p>
        </div>

        {/* Header Right Tools */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#f1e7da] border border-[rgba(196,164,130,0.35)] px-3.5 py-2 rounded-xl text-xs font-semibold text-[#422d1b] shadow-sm">
            <CalendarIcon className="w-4 h-4 text-[#7c5839]" />
            <span>Today, 2026</span>
          </div>

          <div className="flex items-center gap-2.5 bg-[#f1e7da] border border-[rgba(196,164,130,0.35)] px-3 py-1.5 rounded-xl shadow-sm">
            <div className="w-7 h-7 rounded-full bg-[#a67957] flex items-center justify-center text-white font-bold text-xs">
              A
            </div>
            <span className="text-xs font-semibold text-[#231c18]">{data.child_name}'s Parent</span>
          </div>

          <button className="relative p-2.5 bg-[#f1e7da] border border-[rgba(196,164,130,0.35)] rounded-xl text-[#422d1b] hover:bg-[#e6d9c9] transition-all shadow-sm">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#cd7b6b]" />
          </button>
        </div>
      </div>

      {/* Top Row Cards (Light Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Device Status (LILO ESP32) */}
        <div className="card-light p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-bold text-[#231c18]">Device Status</h2>
            <Wifi className="w-4 h-4 text-[#59b275]" />
          </div>
          <p className="text-xs font-bold text-[#6e5f52] mb-4">1 Connected Device</p>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#e6dbcd]/60 border border-[rgba(196,164,130,0.25)]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#a67957] flex items-center justify-center text-white">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold block text-[#231c18]">LILO ESP32 Toy</span>
                  <span className="text-[10px] text-[#76685c]">IP: 192.168.1.104</span>
                </div>
              </div>
              <span className="tag-badge-online">Active/Online</span>
            </div>
          </div>
        </div>

        {/* Card 2: Usage Today */}
        <div className="card-light p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-bold text-[#231c18]">Usage Today</h2>
            <div className="flex items-center gap-1.5 text-[#76685c]">
              <Radio className="w-4 h-4 text-[#a67957]" />
              <Cpu className="w-4 h-4 text-[#7c5839]" />
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div>
              <p className="text-3xl font-extrabold text-[#231c18] tracking-tight">38m</p>
              <p className="text-xs font-medium text-[#76685c] mt-0.5">Voice Interaction</p>
              <div className="mt-3 space-y-0.5 text-[11px] text-[#6e5f52]">
                <p><span className="font-semibold text-[#231c18]">Today Used:</span> 38 mins</p>
                <p><span className="font-semibold text-[#231c18]">Daily Allowance:</span> 60 mins</p>
              </div>
            </div>

            {/* Circular Gauge Ring */}
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#e2d5c4]"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#9c7453]"
                  strokeDasharray="63, 100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-sm font-extrabold text-[#231c18]">63%</span>
                <p className="text-[9px] text-[#76685c]">Goal Progress</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Daily Session Overview */}
        <div className="card-light p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-[#231c18]">Daily Session Overview</h2>
            <Clock className="w-4 h-4 text-[#7c5839]" />
          </div>

          <div className="flex items-center justify-between text-xs font-semibold text-[#6e5f52] mb-1.5 mt-3">
            <span>Voice Activity Progress</span>
            <span>38 / 60 min</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2.5 bg-[#e2d5c4] rounded-full overflow-hidden mb-4">
            <div className="h-full bg-[#9c7453] rounded-full" style={{ width: '63%' }} />
          </div>

          <div className="space-y-1 text-xs text-[#6e5f52]">
            <p className="font-semibold text-[#231c18]">Weekly Voice Activity Summary</p>
            <p><span className="font-semibold text-[#231c18]">Daily Allowance:</span> 60 min/day</p>
            <p><span className="font-semibold text-[#231c18]">Weekly Usage:</span> 4h 50m</p>
          </div>
        </div>
      </div>

      {/* Middle & Lower Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (Light Cards - 5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* LILO Hardware Card */}
          <div className="card-light p-5">
            <p className="text-xs font-semibold text-[#6e5f52] mb-3">Active Hardware</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#e6dbcd]/70 border border-[rgba(196,164,130,0.3)]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#a67957] flex items-center justify-center text-white">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-[#231c18]">LILO ESP32 Companion</span>
                    <span className="text-[10px] text-[#76685c]">Firmware v1.0.4 • Wi-Fi 2.4GHz</span>
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-[#59b275] shadow-sm shadow-[#59b275]/50" />
              </div>
            </div>
          </div>

          {/* Quick LILO Info Card */}
          <div className="card-light p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#231c18]">Companion Settings Summary</h3>
              <Sparkles className="w-4 h-4 text-[#a67957]" />
            </div>

            <div className="space-y-2.5 text-xs text-[#6e5f52]">
              <div className="flex justify-between py-1 border-b border-[rgba(196,164,130,0.2)]">
                <span>Child Name</span>
                <span className="font-semibold text-[#231c18]">{data.child_name} (Age 7)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[rgba(196,164,130,0.2)]">
                <span>Language Style</span>
                <span className="font-semibold text-[#231c18]">Hinglish (Soft)</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Bedtime Quiet Hours</span>
                <span className="font-semibold text-[#236b38]">Active (20:00 - 07:00)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Dark Cards - 7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Card: Weekly Usage Analytics (Dark Card) */}
          <div className="card-dark p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-[#f7f2eb]">Weekly Voice Usage Analytics</h2>
            </div>
            <p className="text-xs text-[#c9bcaa] mb-6">Daily LILO Voice Interaction Time (Minutes)</p>

            {/* Custom Bar Chart */}
            <div className="grid grid-cols-7 gap-3 items-end h-44 pt-4 pb-2 px-2">
              {[
                { day: 'Mon', val: '35m', height: '58%' },
                { day: 'Tue', val: '45m', height: '75%' },
                { day: 'Wed', val: '52m', height: '86%' },
                { day: 'Thu', val: '28m', height: '46%' },
                { day: 'Fri', val: '60m', height: '100%' },
                { day: 'Sat', val: '42m', height: '70%' },
                { day: 'Sun', val: '38m', height: '63%' },
              ].map((item) => (
                <div key={item.day} className="flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[11px] text-[#f7f2eb] font-medium">{item.val}</span>
                  <div className="w-full bg-[#3a3028] rounded-t-md relative overflow-hidden flex items-end h-32">
                    <div
                      className="w-full bg-[#f1e7da] rounded-t-md transition-all duration-500"
                      style={{ height: item.height }}
                    />
                  </div>
                  <span className="text-xs text-[#c9bcaa] font-medium mt-1">{item.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Recent Activity (Dark Card) */}
          <div className="card-dark p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#f7f2eb]">Recent LILO Activity</h2>
              <MoreVertical className="w-4 h-4 text-[#c9bcaa] cursor-pointer" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#c9bcaa]">
                <thead className="text-[11px] text-[#8e8071] border-b border-[rgba(196,164,130,0.15)] uppercase">
                  <tr>
                    <th className="pb-2 font-semibold">Device</th>
                    <th className="pb-2 font-semibold">Child</th>
                    <th className="pb-2 font-semibold">Interaction Activity</th>
                    <th className="pb-2 font-semibold text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(196,164,130,0.08)]">
                  <tr>
                    <td className="py-3 flex items-center gap-2 text-[#f7f2eb]">
                      <span>🧸</span> LILO ESP32
                    </td>
                    <td className="py-3">Aarav</td>
                    <td className="py-3 text-[#f7f2eb]">Asked: "Why do stars twinkle at night?"</td>
                    <td className="py-3 text-right">25m ago</td>
                  </tr>
                  <tr>
                    <td className="py-3 flex items-center gap-2 text-[#f7f2eb]">
                      <span>🧸</span> LILO ESP32
                    </td>
                    <td className="py-3">Aarav</td>
                    <td className="py-3 text-[#f7f2eb]">Played: "Math Riddles Challenge"</td>
                    <td className="py-3 text-right">1h 10m ago</td>
                  </tr>
                  <tr>
                    <td className="py-3 flex items-center gap-2 text-[#f7f2eb]">
                      <span>🧸</span> LILO ESP32
                    </td>
                    <td className="py-3">Aarav</td>
                    <td className="py-3 text-[#f7f2eb]">Listened: "Hanuman Pawan Putra Story"</td>
                    <td className="py-3 text-right">3h 15m ago</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




