import { useEffect, useState } from 'react';
import { fetchProfile, updateProfile } from '../api';
import { UserRound, Save, Check } from 'lucide-react';

const HINGLISH_OPTIONS = [
  {
    value: 'english_only',
    label: 'Pure English',
    desc: 'No Hindi or Hinglish words',
    emoji: '🇬🇧',
  },
  {
    value: 'moderate_hinglish',
    label: 'Soft Hinglish',
    desc: 'Occasional dost, masti, waah...',
    emoji: '🤝',
  },
  {
    value: 'high_hinglish',
    label: 'Full Hinglish',
    desc: 'Rich mix of English & Hindi',
    emoji: '🇮🇳',
  },
];

export default function ChildProfile() {
  const [name, setName] = useState('');
  const [age, setAge] = useState(7);
  const [hinglish, setHinglish] = useState('moderate_hinglish');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchProfile()
      .then((data) => {
        setName(data.child_name || '');
        setAge(data.age || 7);
        setHinglish(data.hinglish_ratio || 'moderate_hinglish');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await updateProfile({ child_name: name, age, hinglish_ratio: hinglish });
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
          <UserRound className="w-8 h-8 text-lilo-400" />
          Child Profile
        </h1>
        <p className="text-text-secondary mt-1">Customize LILO's personality for your child</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Name & Age Card */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-5">Basic Information</h2>

          {/* Name Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-secondary mb-2">Child's Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter child's name"
              className="w-full px-4 py-3 rounded-xl bg-surface-lighter border border-glass-border text-text-primary placeholder-text-muted focus:outline-none focus:border-lilo-500 focus:ring-1 focus:ring-lilo-500/30 transition-all"
            />
          </div>

          {/* Age Slider */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Age: <span className="text-lilo-300 font-bold text-lg">{age}</span> years old
            </label>
            <input
              type="range"
              min={5}
              max={10}
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-lilo-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-lilo-500/30 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-lilo-300
                         [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-lilo-500 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-lilo-300"
              style={{
                background: `linear-gradient(90deg, #4c6ef5 ${((age - 5) / 5) * 100}%, #243352 ${((age - 5) / 5) * 100}%)`,
              }}
            />
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>5 yrs</span>
              <span>6</span>
              <span>7</span>
              <span>8</span>
              <span>9</span>
              <span>10 yrs</span>
            </div>
          </div>

          {/* Persona Preview */}
          <div className="mt-6 p-4 rounded-xl bg-surface/60 border border-glass-border">
            <p className="text-sm text-text-muted">
              🧸 LILO will talk like a warm best friend suited for a{' '}
              <span className="text-lilo-300 font-semibold">{age}-year-old</span>
              {name && (
                <>
                  , calling them <span className="text-amber-400 font-semibold">{name}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Hinglish Ratio Card */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-5">Language Style</h2>
          <p className="text-sm text-text-secondary mb-4">How much Hindi/Hinglish should LILO use?</p>

          <div className="space-y-3">
            {HINGLISH_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setHinglish(opt.value)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                  hinglish === opt.value
                    ? 'bg-lilo-600/15 border-lilo-500/40 shadow-sm'
                    : 'bg-surface-lighter/30 border-glass-border hover:border-lilo-600/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{opt.emoji}</span>
                    <div>
                      <p className="font-semibold text-text-primary text-sm">{opt.label}</p>
                      <p className="text-text-muted text-xs mt-0.5">{opt.desc}</p>
                    </div>
                  </div>
                  {hinglish === opt.value && (
                    <div className="w-6 h-6 rounded-full bg-lilo-600 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
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
              <Save className="w-4 h-4" /> Save Profile
            </>
          )}
        </button>
      </div>
    </div>
  );
}
