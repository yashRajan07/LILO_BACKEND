import { useEffect, useState } from 'react';
import { fetchSchedules, updateSchedules } from '../api';
import { Clock, Moon, Sun, Save, Check } from 'lucide-react';

export default function Schedules() {
  const [enabled, setEnabled] = useState(false);
  const [start, setStart] = useState('20:00');
  const [end, setEnd] = useState('07:00');
  const [weekday, setWeekday] = useState(true);
  const [weekend, setWeekend] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(60);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSchedules()
      .then((data) => {
        setEnabled(data.quiet_hours_enabled ?? false);
        setStart(data.quiet_start || '20:00');
        setEnd(data.quiet_end || '07:00');
        setWeekday(data.weekday_enabled ?? true);
        setWeekend(data.weekend_enabled ?? false);
        setDailyLimit(data.daily_limit_minutes || 60);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await updateSchedules({
        quiet_hours_enabled: enabled,
        quiet_start: start,
        quiet_end: end,
        weekday_enabled: weekday,
        weekend_enabled: weekend,
        daily_limit_minutes: dailyLimit,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // error silently
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-lilo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
          <Clock className="w-8 h-8 text-lilo-400" />
          Schedules & Bedtime
        </h1>
        <p className="text-text-secondary mt-1">Control when LILO is available to chat</p>
      </div>

      {/* Daily Usage Limit Card */}
      <div className="glass-card p-6 mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-1">Daily Usage Limit</h2>
        <p className="text-sm text-text-muted mb-4">Set the maximum daily interaction time allowed for your child</p>
        <div className="grid grid-cols-5 gap-3">
          {[30, 45, 60, 90, 120].map((mins) => (
            <button
              key={mins}
              onClick={() => setDailyLimit(mins)}
              className={`py-3 px-4 rounded-xl border text-center font-semibold text-sm transition-all duration-200 ${
                dailyLimit === mins
                  ? 'bg-lilo-600 border-lilo-500 text-white shadow-lg shadow-lilo-600/30 scale-102'
                  : 'bg-surface-lighter/40 border-glass-border text-text-secondary hover:border-lilo-600/30 hover:text-text-primary'
              }`}
            >
              {mins} min
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bedtime Lock Toggle Card */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Bedtime Lock</h2>
              <p className="text-sm text-text-muted mt-1">LILO will stop responding during quiet hours</p>
            </div>
            {/* Toggle Switch */}
            <button
              onClick={() => setEnabled(!enabled)}
              className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                enabled ? 'bg-lilo-600' : 'bg-surface-lighter'
              }`}
            >
              <div
                className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center ${
                  enabled ? 'left-7.5' : 'left-0.5'
                }`}
              >
                {enabled ? (
                  <Moon className="w-3.5 h-3.5 text-lilo-700" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-text-muted" />
                )}
              </div>
            </button>
          </div>

          {/* Time Pickers */}
          <div className={`space-y-5 transition-opacity duration-300 ${enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  <Moon className="inline w-3.5 h-3.5 mr-1.5 text-lilo-400" />
                  Quiet Starts
                </label>
                <input
                  type="time"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-lighter border border-glass-border text-text-primary focus:outline-none focus:border-lilo-500 focus:ring-1 focus:ring-lilo-500/30 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  <Sun className="inline w-3.5 h-3.5 mr-1.5 text-amber-400" />
                  Quiet Ends
                </label>
                <input
                  type="time"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-lighter border border-glass-border text-text-primary focus:outline-none focus:border-lilo-500 focus:ring-1 focus:ring-lilo-500/30 transition-all"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 rounded-xl bg-surface/60 border border-glass-border">
              <p className="text-sm text-text-muted">
                🌙 LILO will be unavailable from{' '}
                <span className="text-lilo-300 font-semibold">{start}</span> to{' '}
                <span className="text-amber-400 font-semibold">{end}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Day Rules Card */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-2">Day Rules</h2>
          <p className="text-sm text-text-muted mb-5">Which days should the bedtime lock apply?</p>

          <div className={`space-y-3 transition-opacity duration-300 ${enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            {/* Weekday Toggle */}
            <button
              onClick={() => setWeekday(!weekday)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                weekday
                  ? 'bg-lilo-600/15 border-lilo-500/40'
                  : 'bg-surface-lighter/30 border-glass-border hover:border-lilo-600/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📅</span>
                <div className="text-left">
                  <p className="text-sm font-semibold text-text-primary">Weekdays</p>
                  <p className="text-xs text-text-muted">Monday — Friday</p>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  weekday ? 'bg-lilo-600 border-lilo-500' : 'border-text-muted'
                }`}
              >
                {weekday && <Check className="w-3 h-3 text-white" />}
              </div>
            </button>

            {/* Weekend Toggle */}
            <button
              onClick={() => setWeekend(!weekend)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                weekend
                  ? 'bg-lilo-600/15 border-lilo-500/40'
                  : 'bg-surface-lighter/30 border-glass-border hover:border-lilo-600/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎉</span>
                <div className="text-left">
                  <p className="text-sm font-semibold text-text-primary">Weekends</p>
                  <p className="text-xs text-text-muted">Saturday — Sunday</p>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  weekend ? 'bg-lilo-600 border-lilo-500' : 'border-text-muted'
                }`}
              >
                {weekend && <Check className="w-3 h-3 text-white" />}
              </div>
            </button>
          </div>

          {/* Connection Behavior Info */}
          <div className="mt-6 p-4 rounded-xl bg-surface/60 border border-glass-border">
            <p className="text-xs text-text-muted">
              🔒 During quiet hours, if the ESP32 tries to connect, LILO will respond with:
              "It's bedtime! LILO is sleeping now. Come back tomorrow morning!"
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
          {saved ? (
            <>
              <Check className="w-4 h-4" /> Saved!
            </>
          ) : saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Schedule
            </>
          )}
        </button>
      </div>
    </div>
  );
}
