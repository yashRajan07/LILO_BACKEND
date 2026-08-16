import { useEffect, useState } from 'react';
import { fetchSchedules, updateSchedules } from '../api';
import { Clock, Moon, Sun, Save, Check, Calendar } from 'lucide-react';

export default function Schedules() {
  const [enabled, setEnabled] = useState(true);
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
        if (data && Object.keys(data).length > 0) {
          setEnabled(data.quiet_hours_enabled ?? true);
          setStart(data.quiet_start || '20:00');
          setEnd(data.quiet_end || '07:00');
          setWeekday(data.weekday_enabled ?? true);
          setWeekend(data.weekend_enabled ?? false);
          setDailyLimit(data.daily_limit_minutes || 60);
        }
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
    } catch (err) {
      console.error('Failed to update schedules:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#a67957] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-[#231c18] flex items-center gap-3 tracking-tight">
          <Clock className="w-8 h-8 text-[#7c5839]" />
          Schedules & Quiet Hours
        </h1>
        <p className="text-sm font-medium text-[#76685c] mt-1">
          Control daily allowed usage and set bedtime lock hours for LILO
        </p>
      </div>

      {/* Daily Usage Limit Card */}
      <div className="card-light p-6">
        <h2 className="text-lg font-bold text-[#231c18] mb-1">Daily Usage Limit</h2>
        <p className="text-xs text-[#76685c] mb-4">Set the maximum daily interaction time allowed for Aarav</p>
        <div className="grid grid-cols-5 gap-3">
          {[30, 45, 60, 90, 120].map((mins) => (
            <button
              key={mins}
              onClick={() => setDailyLimit(mins)}
              className={`py-2.5 px-4 rounded-xl border text-center font-bold text-sm transition-all duration-200 ${
                dailyLimit === mins
                  ? 'bg-[#7c5839] border-[#61432a] text-white shadow-md'
                  : 'bg-[#f6eee4] border-[rgba(196,164,130,0.3)] text-[#6e5f52] hover:border-[#a67957]'
              }`}
            >
              {mins} min
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bedtime Lock Toggle Card */}
        <div className="card-light p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-[#231c18]">Bedtime Quiet Hours</h2>
              <p className="text-xs text-[#76685c] mt-0.5">LILO will go to sleep and stop responding during quiet hours</p>
            </div>
            {/* Toggle Switch */}
            <button
              onClick={() => setEnabled(!enabled)}
              className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                enabled ? 'bg-[#7c5839]' : 'bg-[#e2d5c4]'
              }`}
            >
              <div
                className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center ${
                  enabled ? 'left-7.5' : 'left-0.5'
                }`}
              >
                {enabled ? (
                  <Moon className="w-3.5 h-3.5 text-[#7c5839]" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-[#76685c]" />
                )}
              </div>
            </button>
          </div>

          {/* Time Pickers */}
          <div className={`space-y-5 transition-opacity duration-300 ${enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#6e5f52] mb-2 uppercase">
                  <Moon className="inline w-3.5 h-3.5 mr-1.5 text-[#7c5839]" />
                  Quiet Starts
                </label>
                <input
                  type="time"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#f6eee4] border border-[rgba(196,164,130,0.4)] text-[#231c18] font-semibold text-sm focus:outline-none focus:border-[#7c5839]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6e5f52] mb-2 uppercase">
                  <Sun className="inline w-3.5 h-3.5 mr-1.5 text-[#e3a54b]" />
                  Quiet Ends
                </label>
                <input
                  type="time"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#f6eee4] border border-[rgba(196,164,130,0.4)] text-[#231c18] font-semibold text-sm focus:outline-none focus:border-[#7c5839]"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 rounded-xl bg-[#e6dbcd]/80 border border-[rgba(196,164,130,0.3)]">
              <p className="text-xs text-[#6e5f52] leading-relaxed">
                🌙 LILO will be sleeping from{' '}
                <span className="text-[#231c18] font-bold">{start}</span> to{' '}
                <span className="text-[#8c5711] font-bold">{end}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Day Rules Card */}
        <div className="card-light p-6">
          <h2 className="text-lg font-bold text-[#231c18] mb-1">Active Days</h2>
          <p className="text-xs text-[#76685c] mb-5">Which days should quiet hours apply?</p>

          <div className={`space-y-3 transition-opacity duration-300 ${enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            {/* Weekday Toggle */}
            <button
              onClick={() => setWeekday(!weekday)}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 ${
                weekday
                  ? 'bg-[#e5d8c8] border-[#a67957] shadow-sm'
                  : 'bg-[#f6eee4] border-[rgba(196,164,130,0.25)] hover:border-[#a67957]/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#7c5839]" />
                <div className="text-left">
                  <p className="text-sm font-bold text-[#231c18]">Weekdays</p>
                  <p className="text-xs text-[#76685c]">Monday — Friday</p>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  weekday ? 'bg-[#7c5839] border-[#61432a]' : 'border-[#978777]'
                }`}
              >
                {weekday && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
            </button>

            {/* Weekend Toggle */}
            <button
              onClick={() => setWeekend(!weekend)}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 ${
                weekend
                  ? 'bg-[#e5d8c8] border-[#a67957] shadow-sm'
                  : 'bg-[#f6eee4] border-[rgba(196,164,130,0.25)] hover:border-[#a67957]/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#a67957]" />
                <div className="text-left">
                  <p className="text-sm font-bold text-[#231c18]">Weekends</p>
                  <p className="text-xs text-[#76685c]">Saturday — Sunday</p>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  weekend ? 'bg-[#7c5839] border-[#61432a]' : 'border-[#978777]'
                }`}
              >
                {weekend && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
            </button>
          </div>

          {/* Connection Behavior Info */}
          <div className="mt-6 p-4 rounded-xl bg-[#e6dbcd]/80 border border-[rgba(196,164,130,0.3)]">
            <p className="text-xs text-[#6e5f52] leading-relaxed">
              🔒 During quiet hours, LILO will gently say:
              "It's bedtime! LILO is sleeping now. Come back tomorrow morning!"
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 px-6 py-3 text-sm">
          {saved ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" /> Saved Schedule!
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

