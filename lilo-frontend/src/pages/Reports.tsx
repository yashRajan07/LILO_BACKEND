import { useEffect, useState } from 'react';
import { fetchReports } from '../api';
import { Activity, Sparkles, TrendingUp, HelpCircle } from 'lucide-react';
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

const CHART_COLORS = ['#9c7453', '#cd7b6b', '#9eb08d', '#e5b77e', '#d6c0a9', '#835e40', '#543925'];

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
  weekly_usage_time?: { session_date: string; total_seconds: number }[];
  weekly_screen_time?: { session_date: string; total_seconds: number }[];
}

const getDummyWeeklyUsage = () => {
  const days = [35, 45, 52, 28, 60, 42, 38];
  return days.map((mins, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    return {
      session_date: d.toISOString().split('T')[0],
      total_seconds: mins * 60,
    };
  });
};

const DEFAULT_REPORTS_DUMMY: ReportsData = {
  topic_distribution: [
    { topic: 'science_space', count: 15 },
    { topic: 'animals_nature', count: 12 },
    { topic: 'math_riddles', count: 9 },
    { topic: 'indian_culture', count: 8 },
    { topic: 'moral_stories', count: 6 },
  ],
  curiosity_highlights: [
    { question: 'Why do stars twinkle at night in space?', topic: 'science_space', logged_at: new Date().toISOString() },
    { question: 'How do peacocks open their colorful feathers so wide?', topic: 'animals_nature', logged_at: new Date(Date.now() - 86400000).toISOString() },
    { question: 'Why is Hanuman called Pawan Putra in ancient stories?', topic: 'indian_culture', logged_at: new Date(Date.now() - 172800000).toISOString() },
    { question: 'If I have 3 apples and share with 2 best friends, how many do we each get?', topic: 'math_riddles', logged_at: new Date(Date.now() - 259200000).toISOString() },
    { question: 'Why is telling the truth always important in stories?', topic: 'moral_stories', logged_at: new Date(Date.now() - 345600000).toISOString() },
    { question: 'Can plants communicate with each other under the ground?', topic: 'animals_nature', logged_at: new Date(Date.now() - 432000000).toISOString() },
    { question: 'How fast does sun light travel from the Sun to Earth?', topic: 'science_space', logged_at: new Date(Date.now() - 518400000).toISOString() },
  ],
  weekly_usage_time: getDummyWeeklyUsage(),
};

export default function Reports() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports()
      .then((res) => {
        const topics = res.topic_distribution && res.topic_distribution.length > 0
          ? res.topic_distribution
          : DEFAULT_REPORTS_DUMMY.topic_distribution;
        const highlights = res.curiosity_highlights && res.curiosity_highlights.length > 0
          ? res.curiosity_highlights
          : DEFAULT_REPORTS_DUMMY.curiosity_highlights;
        const rawWeekly = res.weekly_usage_time || res.weekly_screen_time;
        const weekly = rawWeekly && rawWeekly.length > 0 ? rawWeekly : DEFAULT_REPORTS_DUMMY.weekly_usage_time;

        setData({
          topic_distribution: topics,
          curiosity_highlights: highlights,
          weekly_usage_time: weekly,
        });
      })
      .catch(() => setData(DEFAULT_REPORTS_DUMMY))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#a67957] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const pieData = data.topic_distribution.map((t) => ({
    name: TOPIC_LABELS[t.topic] || t.topic,
    value: t.count,
  }));

  const usageWeekly = data.weekly_usage_time || data.weekly_screen_time || DEFAULT_REPORTS_DUMMY.weekly_usage_time!;
  const barData = usageWeekly.map((d) => ({
    day: new Date(d.session_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
    minutes: Math.round(d.total_seconds / 60),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-[#231c18] flex items-center gap-3 tracking-tight">
          <Activity className="w-8 h-8 text-[#7c5839]" />
          Activity & Curiosity Highlights
        </h1>
        <p className="text-sm font-medium text-[#76685c] mt-1">
          Weekly analytics of Aarav's interactions and questions asked to LILO
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart Card */}
        <div className="card-light p-6">
          <h2 className="text-base font-bold text-[#231c18] mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#a67957]" />
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
                      background: '#27201b',
                      border: '1px solid rgba(196,164,130,0.25)',
                      borderRadius: '12px',
                      color: '#f7f2eb',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {pieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs text-[#6e5f52] font-semibold">
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
            <div className="flex items-center justify-center h-48 text-[#978777] text-sm">
              No topic data available yet
            </div>
          )}
        </div>

        {/* Usage Time Bar Chart */}
        <div className="card-light p-6">
          <h2 className="text-base font-bold text-[#231c18] mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#7c5839]" />
            Weekly Voice Interaction Time
          </h2>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(196,164,130,0.2)" />
                <XAxis dataKey="day" tick={{ fill: '#6e5f52', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6e5f52', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} unit="m" />
                <Tooltip
                  contentStyle={{
                    background: '#27201b',
                    border: '1px solid rgba(196,164,130,0.25)',
                    borderRadius: '12px',
                    color: '#f7f2eb',
                    fontSize: '12px',
                  }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={((value: any) => [`${value} min`, 'Voice Time']) as any}
                />
                <Bar dataKey="minutes" radius={[6, 6, 0, 0]} fill="#a67957" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-[#978777] text-sm">
              No usage time data available yet
            </div>
          )}
        </div>
      </div>

      {/* Curiosity Highlights */}
      <div className="card-light p-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-[#a67957]" />
          <h2 className="text-lg font-bold text-[#231c18]">Curiosity Highlights</h2>
        </div>
        <p className="text-xs text-[#76685c] mb-5">Recent engaging questions asked by Aarav to LILO</p>

        {data.curiosity_highlights.length > 0 ? (
          <div className="space-y-3">
            {data.curiosity_highlights.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3.5 p-4 rounded-xl bg-[#e6dbcd]/60 border border-[rgba(196,164,130,0.3)] transition-all hover:bg-[#e6dbcd]"
              >
                <div className="w-8 h-8 rounded-full bg-[#fce8cc] text-[#8c5711] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[#231c18] font-bold">"{item.question}"</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#a67957]/15 text-[#7c5839]">
                      {TOPIC_LABELS[item.topic] || item.topic}
                    </span>
                    <span className="text-[11px] text-[#76685c] font-medium">
                      {new Date(item.logged_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-[#978777] text-xs font-medium">No curiosity highlights yet</p>
          </div>
        )}
      </div>
    </div>
  );
}


