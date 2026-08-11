import { useEffect, useState } from 'react';
import { fetchDashboard } from '../api';
import { Wifi, WifiOff, Clock, Zap, Moon } from 'lucide-react';

interface DashboardData {
  device: {
    is_online: boolean;
    last_connected_at: string | null;
    ip_address: string | null;
  };
  screen_time: {
    today_seconds: number;
    today_minutes: number;
    daily_limit_minutes: number;
    weekly: { session_date: string; total_seconds: number }[];
  };
  child_name: string;
  quiet_hours_enabled: boolean;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard()
      .then(setData)
      .catch(() =>
        setData({
          device: { is_online: false, last_connected_at: null, ip_address: null },
          screen_time: { today_seconds: 0, today_minutes: 0, daily_limit_minutes: 60, weekly: [] },
          child_name: 'Buddy',
          quiet_hours_enabled: false,
        })
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-lilo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const progressPercent = Math.min(
    (data.screen_time.today_minutes / data.screen_time.daily_limit_minutes) * 100,
    100
  );
  const isWarning = progressPercent > 75;
  const isOverLimit = progressPercent >= 100;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">
          Welcome back! 👋
        </h1>
        <p className="text-text-secondary mt-1">
          Here's how <span className="text-lilo-300 font-semibold">{data.child_name}</span> is doing today
        </p>
      </div>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {/* ESP32 Status Card */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-text-muted text-sm font-medium uppercase tracking-wider">Device Status</span>
            {data.device.is_online ? (
              <Wifi className="w-5 h-5 text-emerald-400" />
            ) : (
              <WifiOff className="w-5 h-5 text-coral-400" />
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className={`glow-dot ${data.device.is_online ? 'glow-dot-online' : 'glow-dot-offline'}`} />
            <div>
              <p className="text-lg font-bold">{data.device.is_online ? 'Online' : 'Offline'}</p>
              {data.device.ip_address && (
                <p className="text-xs text-text-muted">{data.device.ip_address}</p>
              )}
            </div>
          </div>
          {data.device.last_connected_at && (
            <p className="text-xs text-text-muted mt-3">
              Last seen: {new Date(data.device.last_connected_at).toLocaleString()}
            </p>
          )}
        </div>

        {/* Screen Time Card */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-text-muted text-sm font-medium uppercase tracking-wider">Screen Time</span>
            <Clock className="w-5 h-5 text-lilo-400" />
          </div>
          <p className="text-3xl font-bold mb-1">
            <span className={isOverLimit ? 'text-coral-400' : isWarning ? 'text-amber-400' : 'text-text-primary'}>
              {Math.round(data.screen_time.today_minutes)}
            </span>
            <span className="text-text-muted text-lg font-normal"> / {data.screen_time.daily_limit_minutes} min</span>
          </p>
          {/* Progress Bar */}
          <div className="w-full h-2 bg-surface-lighter rounded-full mt-3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${progressPercent}%`,
                background: isOverLimit
                  ? 'linear-gradient(90deg, #ff6b6b, #ff8787)'
                  : isWarning
                  ? 'linear-gradient(90deg, #fcc419, #ffd43b)'
                  : 'linear-gradient(90deg, #4c6ef5, #748ffc)',
              }}
            />
          </div>
          <p className="text-xs text-text-muted mt-2">
            {isOverLimit ? '⚠️ Daily limit exceeded' : isWarning ? '⚡ Approaching daily limit' : '✨ Looking good!'}
          </p>
        </div>

        {/* Quick Status Card */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-text-muted text-sm font-medium uppercase tracking-wider">Quick Info</span>
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Bedtime Lock</span>
              <span
                className={`text-sm font-semibold flex items-center gap-1.5 ${
                  data.quiet_hours_enabled ? 'text-emerald-400' : 'text-text-muted'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                {data.quiet_hours_enabled ? 'Active' : 'Off'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Sessions Today</span>
              <span className="text-sm font-semibold text-text-primary">
                {data.screen_time.weekly.length > 0 ? data.screen_time.weekly[data.screen_time.weekly.length - 1]?.total_seconds ? '1+' : '0' : '0'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Overview */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4 text-text-primary">This Week's Activity</h2>
        {data.screen_time.weekly.length > 0 ? (
          <div className="grid grid-cols-7 gap-2">
            {data.screen_time.weekly.map((day) => {
              const mins = Math.round(day.total_seconds / 60);
              const height = Math.min((mins / data.screen_time.daily_limit_minutes) * 100, 100);
              return (
                <div key={day.session_date} className="flex flex-col items-center gap-2">
                  <div className="w-full h-24 bg-surface-lighter rounded-lg relative overflow-hidden flex items-end">
                    <div
                      className="w-full rounded-lg transition-all duration-500"
                      style={{
                        height: `${Math.max(height, 4)}%`,
                        background: height > 90
                          ? 'linear-gradient(to top, #ff6b6b, #ff8787)'
                          : 'linear-gradient(to top, #4c6ef5, #748ffc)',
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-text-muted">
                    {new Date(day.session_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span className="text-xs text-text-secondary font-medium">{mins}m</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-text-muted text-sm text-center py-8">No activity data yet. Connect your LILO device to get started!</p>
        )}
      </div>
    </div>
  );
}
