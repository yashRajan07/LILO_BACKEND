const API_BASE = '/api/parent';

export async function fetchDashboard() {
  const res = await fetch(`${API_BASE}/dashboard`);
  if (!res.ok) throw new Error('Failed to fetch dashboard');
  return res.json();
}

export async function fetchProfile() {
  const res = await fetch(`${API_BASE}/profile`);
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
}

export async function updateProfile(data: {
  child_name?: string;
  age?: number;
  hinglish_ratio?: string;
}) {
  const res = await fetch(`${API_BASE}/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update profile');
  return res.json();
}

export async function fetchLearningControls() {
  const res = await fetch(`${API_BASE}/learning-controls`);
  if (!res.ok) throw new Error('Failed to fetch learning controls');
  return res.json();
}

export async function updateLearningControls(data: {
  target_topics?: string[];
  banned_topics?: string[];
}) {
  const res = await fetch(`${API_BASE}/learning-controls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update learning controls');
  return res.json();
}

export async function fetchSchedules() {
  const res = await fetch(`${API_BASE}/schedules`);
  if (!res.ok) throw new Error('Failed to fetch schedules');
  return res.json();
}

export async function updateSchedules(data: {
  quiet_hours_enabled?: boolean;
  quiet_start?: string;
  quiet_end?: string;
  weekday_enabled?: boolean;
  weekend_enabled?: boolean;
}) {
  const res = await fetch(`${API_BASE}/schedules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update schedules');
  return res.json();
}

export async function fetchReports() {
  const res = await fetch(`${API_BASE}/reports`);
  if (!res.ok) throw new Error('Failed to fetch reports');
  return res.json();
}
