import { useEffect, useState } from 'react';
import { fetchReports } from '../api';
import { BarChart3, Sparkles, TrendingUp } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const CHART_COLORS = ['#748ffc', '#ff6b6b', '#51cf66', '#fcc419', '#cc5de8', '#20c997', '#ff922b'];

const TOPIC_LABELS: Record<string, string> = {
  science_space: 'Science & Space',
  indian_culture: 'Indian Culture',
  math_riddles: 'Math Riddles',
  moral_stories: 'Moral Stories',
  animals_nature: 'Animals & Nature',
};

interface ReportsData {
  topic_distribution: { topic: string; count: number }[];
  curiosity_highlights: { question: string; topic: string; logged_at: string }[];
  weekly_screen_time: { session_date: string; total_seconds: number }[];
}

export default function Reports() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports()
      .then(setData)
      .catch(() =>
        setData({
          topic_distribution: [],
          curiosity_highlights: [],
          weekly_screen_time: [],
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

  const pieData = data.topic_distribution.map((t) => ({
    name: TOPIC_LABELS[t.topic] || t.topic,
    value: t.count,
  }));

  const barData = data.weekly_screen_time.map((d) => ({
    day: new Date(d.session_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
    minutes: Math.round(d.total_seconds / 60),
  }));

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-lilo-400" />
          Reports & Analytics
        </h1>
        <p className="text-text-secondary mt-1">Weekly insights into your child's learning</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Pie Chart Card */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-lilo-400" />
            Topic Distribution
          </h2>
          {pieData.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#1a2744',
                      border: '1px solid rgba(116,143,252,0.15)',
                      borderRadius: '12px',
                      color: '#e8ecf4',
                      fontSize: '13px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {pieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    {entry.name}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-text-muted text-sm">
              No topic data available yet
            </div>
          )}
        </div>

        {/* Screen Time Bar Chart */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            Weekly Screen Time
          </h2>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(116,143,252,0.08)" />
                <XAxis dataKey="day" tick={{ fill: '#5a6d9a', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#5a6d9a', fontSize: 12 }} axisLine={false} tickLine={false} unit="m" />
                <Tooltip
                  contentStyle={{
                    background: '#1a2744',
                    border: '1px solid rgba(116,143,252,0.15)',
                    borderRadius: '12px',
                    color: '#e8ecf4',
                    fontSize: '13px',
                  }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={((value: any) => [`${value} min`, 'Screen Time']) as any}
                />
                <Bar dataKey="minutes" radius={[6, 6, 0, 0]} fill="#4c6ef5" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-text-muted text-sm">
              No screen time data available yet
            </div>
          )}
        </div>
      </div>

      {/* Curiosity Highlights */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          Curiosity Highlights
        </h2>
        <p className="text-sm text-text-muted mb-4">Interesting questions your child asked this week</p>

        {data.curiosity_highlights.length > 0 ? (
          <div className="space-y-3">
            {data.curiosity_highlights.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-xl bg-surface-lighter/30 border border-glass-border animate-slide-in"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <span className="text-lg mt-0.5">💡</span>
                <div className="flex-1">
                  <p className="text-sm text-text-primary font-medium">"{item.question}"</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-lilo-400 font-medium">
                      {TOPIC_LABELS[item.topic] || item.topic}
                    </span>
                    <span className="text-xs text-text-muted">
                      {new Date(item.logged_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-text-muted text-sm">No curiosity highlights yet</p>
            <p className="text-text-muted text-xs mt-1">Questions will appear here as your child uses LILO</p>
          </div>
        )}
      </div>
    </div>
  );
}
