const API_BASE = '/api/parent';

// Simple in-memory cache for fast tab switching
const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 30000; // 30 seconds TTL

async function fetchWithCache(url: string, forceFresh = false) {
  const now = Date.now();
  if (!forceFresh && cache[url] && now - cache[url].timestamp < CACHE_TTL) {
    return cache[url].data;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  const data = await res.json();
  cache[url] = { data, timestamp: now };
  return data;
}

export async function fetchDashboard() {
  return fetchWithCache(`${API_BASE}/dashboard`);
}

export async function fetchProfile() {
  return fetchWithCache(`${API_BASE}/profile`);
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
  delete cache[`${API_BASE}/profile`];
  delete cache[`${API_BASE}/dashboard`];
  return res.json();
}

export async function fetchLearningControls() {
  return fetchWithCache(`${API_BASE}/learning-controls`);
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
  delete cache[`${API_BASE}/learning-controls`];
  return res.json();
}

export async function fetchSchedules() {
  return fetchWithCache(`${API_BASE}/schedules`);
}

export async function updateSchedules(data: {
  quiet_hours_enabled?: boolean;
  quiet_start?: string;
  quiet_end?: string;
  weekday_enabled?: boolean;
  weekend_enabled?: boolean;
  daily_limit_minutes?: number;
}) {
  const res = await fetch(`${API_BASE}/schedules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update schedules');
  delete cache[`${API_BASE}/schedules`];
  delete cache[`${API_BASE}/dashboard`];
  return res.json();
}

export async function fetchReports() {
  return fetchWithCache(`${API_BASE}/reports`);
}

