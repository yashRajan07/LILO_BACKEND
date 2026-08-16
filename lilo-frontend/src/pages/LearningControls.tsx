import { useEffect, useState } from 'react';
import { fetchLearningControls, updateLearningControls } from '../api';
import { BookOpen, Save, Check, X, Plus, ShieldAlert, Sparkles } from 'lucide-react';

const AVAILABLE_TOPICS = [
  { id: 'science_space', label: 'Science & Space', emoji: '🚀' },
  { id: 'indian_culture', label: 'Indian Culture & Mythology', emoji: '🪷' },
  { id: 'math_riddles', label: 'Math Riddles', emoji: '🧮' },
  { id: 'moral_stories', label: 'Moral Stories', emoji: '📖' },
  { id: 'animals_nature', label: 'Animals & Nature', emoji: '🦚' },
];

const DEFAULT_TARGET_TOPICS = [
  'science_space',
  'indian_culture',
  'math_riddles',
  'moral_stories',
  'animals_nature',
];
const DEFAULT_BANNED_TOPICS = ['scary stories', 'monsters', 'horror movies'];

export default function LearningControls() {
  const [targetTopics, setTargetTopics] = useState<string[]>(DEFAULT_TARGET_TOPICS);
  const [bannedTopics, setBannedTopics] = useState<string[]>(DEFAULT_BANNED_TOPICS);
  const [newBanned, setNewBanned] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchLearningControls()
      .then((data) => {
        if (data) {
          setTargetTopics(data.target_topics?.length ? data.target_topics : DEFAULT_TARGET_TOPICS);
          setBannedTopics(data.banned_topics?.length ? data.banned_topics : DEFAULT_BANNED_TOPICS);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleTopic = (id: string) => {
    setTargetTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const addBanned = () => {
    const trimmed = newBanned.trim().toLowerCase();
    if (trimmed && !bannedTopics.includes(trimmed)) {
      setBannedTopics((prev) => [...prev, trimmed]);
      setNewBanned('');
    }
  };

  const removeBanned = (topic: string) => {
    setBannedTopics((prev) => prev.filter((t) => t !== topic));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await updateLearningControls({
        target_topics: targetTopics,
        banned_topics: bannedTopics,
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
        <div className="w-8 h-8 border-2 border-[#a67957] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-[#231c18] flex items-center gap-3 tracking-tight">
          <BookOpen className="w-8 h-8 text-[#7c5839]" />
          Learning Controls
        </h1>
        <p className="text-sm font-medium text-[#76685c] mt-1">
          Customize what topics LILO teaches and steers away from during voice interactions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Target Topics */}
        <div className="card-light p-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-[#a67957]" />
            <h2 className="text-lg font-bold text-[#231c18]">Focus Topics</h2>
          </div>
          <p className="text-xs text-[#76685c] mb-5">LILO will steer curious questions towards these subject areas</p>

          <div className="space-y-3">
            {AVAILABLE_TOPICS.map((topic) => {
              const isSelected = targetTopics.includes(topic.id);
              return (
                <button
                  key={topic.id}
                  onClick={() => toggleTopic(topic.id)}
                  className={`w-full flex items-center gap-3.5 p-3.5 rounded-xl border transition-all duration-200 text-left ${
                    isSelected
                      ? 'bg-[#e5d8c8] border-[#a67957] shadow-sm'
                      : 'bg-[#f6eee4] border-[rgba(196,164,130,0.25)] hover:border-[#a67957]/50'
                  }`}
                >
                  <span className="text-2xl">{topic.emoji}</span>
                  <span className="flex-1 text-sm font-semibold text-[#231c18]">{topic.label}</span>
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[#7c5839] border-[#61432a]'
                        : 'border-[#978777]'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Banned Topics */}
        <div className="card-light p-6">
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-5 h-5 text-[#cd7b6b]" />
            <h2 className="text-lg font-bold text-[#231c18]">Banned Topics</h2>
          </div>
          <p className="text-xs text-[#76685c] mb-5">LILO will avoid these subjects and redirect politely</p>

          {/* Add Input */}
          <div className="flex gap-2 mb-5">
            <input
              type="text"
              value={newBanned}
              onChange={(e) => setNewBanned(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addBanned()}
              placeholder="Add topic e.g. ghosts, monsters..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#f6eee4] border border-[rgba(196,164,130,0.4)] text-[#231c18] placeholder-[#978777] focus:outline-none focus:border-[#7c5839] focus:ring-1 focus:ring-[#7c5839]/30 text-sm font-medium"
            />
            <button
              onClick={addBanned}
              className="px-4 py-2.5 rounded-xl bg-[#7c5839] text-white hover:bg-[#61432a] transition-all flex items-center justify-center font-semibold text-sm shadow-sm"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Banned Topic Tags */}
          {bannedTopics.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-6">
              {bannedTopics.map((topic) => (
                <span
                  key={topic}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#fce8cc] text-[#8c5711] border border-[#e3a54b]/40 shadow-xs"
                >
                  {topic}
                  <button
                    onClick={() => removeBanned(topic)}
                    className="p-0.5 rounded-full hover:bg-[#8c5711]/15 text-[#8c5711] transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border border-dashed border-[rgba(196,164,130,0.4)] rounded-xl mb-6">
              <p className="text-[#978777] text-xs font-medium">No banned topics configured</p>
            </div>
          )}

          {/* Redirection Note */}
          <div className="p-4 rounded-xl bg-[#e6dbcd]/80 border border-[rgba(196,164,130,0.3)] space-y-1">
            <p className="text-xs font-semibold text-[#231c18]">💡 Smart Gentle Redirection</p>
            <p className="text-xs text-[#6e5f52] leading-relaxed">
              If Aarav asks about a banned topic, LILO politely redirects: "That's a bit tricky for today! Want to hear a cool space riddle instead?"
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 px-6 py-3 text-sm">
          {saved ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" /> Saved Controls!
            </>
          ) : saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Learning Controls
            </>
          )}
        </button>
      </div>
    </div>
  );
}

