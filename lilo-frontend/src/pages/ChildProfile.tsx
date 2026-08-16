import { useEffect, useState } from 'react';
import { fetchProfile, updateProfile } from '../api';
import { UserRound, Save, Check, Sparkles } from 'lucide-react';

const HINGLISH_OPTIONS = [
  {
    value: 'english_only',
    label: 'English',
    desc: 'Pure English only',
    emoji: '🇬🇧',
  },
  {
    value: 'hindi_only',
    label: 'Hindi',
    desc: 'Pure Hindi language',
    emoji: '🇮🇳',
  },
  {
    value: 'moderate_hinglish',
    label: 'Hinglish (Soft)',
    desc: 'Simple English with dost, masti, waah...',
    emoji: '🤝',
  },
  {
    value: 'high_hinglish',
    label: 'Hinglish (Full)',
    desc: 'Rich mix of English & Hindi',
    emoji: '🎭',
  },
];

export default function ChildProfile() {
  const [name, setName] = useState('Aarav');
  const [age, setAge] = useState(7);
  const [hinglish, setHinglish] = useState('moderate_hinglish');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchProfile()
      .then((data) => {
        if (data) {
          setName(data.child_name || 'Aarav');
          setAge(data.age || 7);
          setHinglish(data.hinglish_ratio || 'moderate_hinglish');
        }
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
        <div className="w-8 h-8 border-2 border-[#a67957] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-[#231c18] flex items-center gap-3 tracking-tight">
          <UserRound className="w-8 h-8 text-[#7c5839]" />
          Child Profile
        </h1>
        <p className="text-sm font-medium text-[#76685c] mt-1">
          Customize LILO's persona, age appropriateness, and speaking language
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Name & Age Card */}
        <div className="card-light p-6">
          <h2 className="text-lg font-bold text-[#231c18] mb-5">Basic Information</h2>

          {/* Name Input */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-[#6e5f52] uppercase mb-2">Child's Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter child's name"
              className="w-full px-4 py-2.5 rounded-xl bg-[#f6eee4] border border-[rgba(196,164,130,0.4)] text-[#231c18] placeholder-[#978777] focus:outline-none focus:border-[#7c5839] focus:ring-1 focus:ring-[#7c5839]/30 text-sm font-semibold"
            />
          </div>

          {/* Age Slider */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-[#6e5f52] uppercase mb-2">
              Age: <span className="text-[#7c5839] font-bold text-base">{age} years old</span>
            </label>
            <input
              type="range"
              min={5}
              max={15}
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer bg-[#e2d5c4] accent-[#7c5839]"
            />
            <div className="flex justify-between text-xs text-[#76685c] mt-1.5 font-medium">
              <span>5 yrs</span>
              <span>7</span>
              <span>9</span>
              <span>11</span>
              <span>13</span>
              <span>15 yrs</span>
            </div>
          </div>

          {/* Persona Preview */}
          <div className="p-4 rounded-xl bg-[#e6dbcd]/80 border border-[rgba(196,164,130,0.3)] flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#a67957] shrink-0 mt-0.5" />
            <p className="text-xs text-[#6e5f52] leading-relaxed">
              LILO will speak like a warm, supportive best friend tailored for a{' '}
              <span className="text-[#231c18] font-bold">{age}-year-old</span>, calling them{' '}
              <span className="text-[#8c5711] font-bold">{name}</span>!
            </p>
          </div>
        </div>

        {/* Hinglish Ratio Card */}
        <div className="card-light p-6">
          <h2 className="text-lg font-bold text-[#231c18] mb-1">Language Style</h2>
          <p className="text-xs text-[#76685c] mb-5">Select how LILO balances English & Hindi</p>

          <div className="space-y-3">
            {HINGLISH_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setHinglish(opt.value)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 ${
                  hinglish === opt.value
                    ? 'bg-[#e5d8c8] border-[#a67957] shadow-sm'
                    : 'bg-[#f6eee4] border-[rgba(196,164,130,0.25)] hover:border-[#a67957]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{opt.emoji}</span>
                    <div>
                      <p className="font-bold text-[#231c18] text-sm">{opt.label}</p>
                      <p className="text-[#76685c] text-xs mt-0.5 font-medium">{opt.desc}</p>
                    </div>
                  </div>
                  {hinglish === opt.value && (
                    <div className="w-6 h-6 rounded-full bg-[#7c5839] flex items-center justify-center">
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
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 px-6 py-3 text-sm">
          {saved ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" /> Saved Profile!
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

