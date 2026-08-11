import { useEffect, useState } from 'react';
import { fetchLearningControls, updateLearningControls } from '../api';
import { BookOpen, Save, Check, X, Plus } from 'lucide-react';

const AVAILABLE_TOPICS = [
  { id: 'science_space', label: 'Science & Space', emoji: '🚀' },
  { id: 'indian_culture', label: 'Indian Culture & Mythology', emoji: '🪷' },
  { id: 'math_riddles', label: 'Math Riddles', emoji: '🧮' },
  { id: 'moral_stories', label: 'Moral Stories', emoji: '📖' },
  { id: 'animals_nature', label: 'Animals & Nature', emoji: '🦚' },
];

export default function LearningControls() {
  const [targetTopics, setTargetTopics] = useState<string[]>([]);
  const [bannedTopics, setBannedTopics] = useState<string[]>([]);
  const [newBanned, setNewBanned] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchLearningControls()
      .then((data) => {
        setTargetTopics(data.target_topics || []);
        setBannedTopics(data.banned_topics || []);
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
        <div className="w-8 h-8 border-2 border-lilo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-lilo-400" />
          Learning Controls
        </h1>
        <p className="text-text-secondary mt-1">Guide what LILO teaches and avoids</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Target Topics */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-2">Focus Topics</h2>
          <p className="text-sm text-text-muted mb-5">LILO will steer conversations toward these subjects</p>

          <div className="space-y-3">
            {AVAILABLE_TOPICS.map((topic) => {
              const isSelected = targetTopics.includes(topic.id);
              return (
                <button
                  key={topic.id}
                  onClick={() => toggleTopic(topic.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 text-left ${
                    isSelected
                      ? 'bg-lilo-600/15 border-lilo-500/40'
                      : 'bg-surface-lighter/30 border-glass-border hover:border-lilo-600/20'
                  }`}
                >
                  <span className="text-2xl">{topic.emoji}</span>
                  <span className="flex-1 text-sm font-medium text-text-primary">{topic.label}</span>
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-lilo-600 border-lilo-500'
                        : 'border-text-muted'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Banned Topics */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-2">Banned Topics</h2>
          <p className="text-sm text-text-muted mb-5">LILO will never discuss these, redirecting politely instead</p>

          {/* Input */}
          <div className="flex gap-2 mb-5">
            <input
              type="text"
              value={newBanned}
              onChange={(e) => setNewBanned(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addBanned()}
              placeholder="e.g. ghosts, violence, scary stories..."
              className="flex-1 px-4 py-3 rounded-xl bg-surface-lighter border border-glass-border text-text-primary placeholder-text-muted focus:outline-none focus:border-lilo-500 focus:ring-1 focus:ring-lilo-500/30 transition-all text-sm"
            />
            <button
              onClick={addBanned}
              className="px-4 py-3 rounded-xl bg-lilo-600/20 border border-lilo-500/30 text-lilo-300 hover:bg-lilo-600/30 transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Tags */}
          {bannedTopics.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {bannedTopics.map((topic) => (
                <button key={topic} onClick={() => removeBanned(topic)} className="tag-badge">
                  {topic}
                  <X className="w-3 h-3" />
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-text-muted text-sm">No banned topics yet</p>
              <p className="text-text-muted text-xs mt-1">Add topics above that LILO should avoid</p>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-6 p-4 rounded-xl bg-surface/60 border border-glass-border">
            <p className="text-xs text-text-muted">
              💡 If a child asks about a banned topic, LILO will gently redirect: "That's a bit too
              complicated for today! Want to hear a cool space fact instead?"
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
              <Save className="w-4 h-4" /> Save Controls
            </>
          )}
        </button>
      </div>
    </div>
  );
}
