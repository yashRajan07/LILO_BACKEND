"""
LILO Voice Assistant — Parent Portal Database Layer

SQLite-backed persistence for child profile settings, learning controls,
bedtime schedules, usage metrics, and topic analytics.
"""

import os
import json
import sqlite3
import logging
from datetime import datetime, date
from contextlib import contextmanager

logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "lilo_parent.db")


@contextmanager
def get_db():
    """Context manager for SQLite connections with WAL mode."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    """Create all tables and seed defaults with rich dummy data if empty."""
    with get_db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS child_profile (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                child_name TEXT NOT NULL DEFAULT 'Aarav',
                age INTEGER NOT NULL DEFAULT 7 CHECK (age BETWEEN 5 AND 15),
                hinglish_ratio TEXT NOT NULL DEFAULT 'moderate_hinglish'
                    CHECK (hinglish_ratio IN ('english_only', 'hindi_only', 'moderate_hinglish', 'high_hinglish'))
            );

            CREATE TABLE IF NOT EXISTS learning_controls (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                target_topics TEXT NOT NULL DEFAULT '["science_space","indian_culture","math_riddles","moral_stories","animals_nature"]',
                banned_topics TEXT NOT NULL DEFAULT '["scary stories","monsters"]'
            );

            CREATE TABLE IF NOT EXISTS schedules (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                quiet_hours_enabled INTEGER NOT NULL DEFAULT 1,
                quiet_start TEXT NOT NULL DEFAULT '20:00',
                quiet_end TEXT NOT NULL DEFAULT '07:00',
                weekday_enabled INTEGER NOT NULL DEFAULT 1,
                weekend_enabled INTEGER NOT NULL DEFAULT 0,
                daily_limit_minutes INTEGER NOT NULL DEFAULT 60
            );

            CREATE TABLE IF NOT EXISTS device_status (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                is_online INTEGER NOT NULL DEFAULT 1,
                last_connected_at TEXT,
                ip_address TEXT DEFAULT '192.168.1.104'
            );

            CREATE TABLE IF NOT EXISTS usage_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_date TEXT NOT NULL,
                duration_seconds REAL NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS topic_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                topic TEXT NOT NULL,
                question TEXT,
                logged_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            -- Seed base tables (INSERT OR IGNORE ensures one-time only)
            INSERT OR IGNORE INTO child_profile (id, child_name, age, hinglish_ratio)
            VALUES (1, 'Aarav', 7, 'moderate_hinglish');

            INSERT OR IGNORE INTO learning_controls (id, target_topics, banned_topics)
            VALUES (1, '["science_space","indian_culture","math_riddles","moral_stories","animals_nature"]', '["scary stories","monsters"]');

            INSERT OR IGNORE INTO schedules (id, quiet_hours_enabled, quiet_start, quiet_end, weekday_enabled, weekend_enabled, daily_limit_minutes)
            VALUES (1, 1, '20:00', '07:00', 1, 0, 60);

            INSERT OR IGNORE INTO device_status (id, is_online, last_connected_at, ip_address)
            VALUES (1, 1, datetime('now'), '192.168.1.104');
        """)
        
        # Dynamic schema migration check for daily_limit_minutes
        try:
            conn.execute("ALTER TABLE schedules ADD COLUMN daily_limit_minutes INTEGER NOT NULL DEFAULT 60")
        except sqlite3.OperationalError:
            pass  # Column already exists

        # Seed rich dummy usage logs for the past 7 days if usage_logs is empty
        count_usage = conn.execute("SELECT COUNT(*) FROM usage_logs").fetchone()[0]
        if count_usage == 0:
            dummy_minutes = [35, 45, 52, 28, 60, 42, 38]
            for idx, mins in enumerate(dummy_minutes):
                conn.execute(
                    "INSERT INTO usage_logs (session_date, duration_seconds) VALUES (date('now', ?), ?)",
                    (f"-{6 - idx} days", mins * 60)
                )

        # Seed rich dummy curiosity topic logs if topic_logs is empty
        count_topics = conn.execute("SELECT COUNT(*) FROM topic_logs").fetchone()[0]
        if count_topics == 0:
            sample_questions = [
                ("science_space", "Why do stars twinkle at night in space?"),
                ("animals_nature", "How do peacocks open their colorful feathers so wide?"),
                ("indian_culture", "Why is Hanuman called Pawan Putra in ancient stories?"),
                ("math_riddles", "If I have 3 apples and share with 2 best friends, how many do we each get?"),
                ("moral_stories", "Why is telling the truth always important in stories?"),
                ("animals_nature", "Can trees communicate with each other under the ground?"),
                ("science_space", "How fast does sun light travel from the Sun to Earth?"),
                ("science_space", "What causes rainbows to appear after rain?"),
                ("animals_nature", "Why do dolphins jump out of the water?"),
                ("math_riddles", "What number comes next in 2, 4, 6, 8?"),
                ("indian_culture", "What is the story of Diwali lamps?"),
                ("moral_stories", "What is the lesson of the tortoise and the hare?"),
            ]
            for topic, q in sample_questions:
                conn.execute(
                    "INSERT INTO topic_logs (topic, question, logged_at) VALUES (?, ?, datetime('now', '-1 hours'))",
                    (topic, q)
                )

    logger.info(f"LILO Parent DB initialized with dummy data at {DB_PATH}")


# ── Child Profile ─────────────────────────────────────────────────

def get_child_profile() -> dict:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM child_profile WHERE id = 1").fetchone()
        return dict(row) if row else {}


def update_child_profile(child_name: str = None, age: int = None, hinglish_ratio: str = None) -> dict:
    updates, params = [], []
    if child_name is not None:
        updates.append("child_name = ?")
        params.append(child_name)
    if age is not None:
        updates.append("age = ?")
        params.append(age)
    if hinglish_ratio is not None:
        updates.append("hinglish_ratio = ?")
        params.append(hinglish_ratio)
    if not updates:
        return get_child_profile()
    with get_db() as conn:
        conn.execute(f"UPDATE child_profile SET {', '.join(updates)} WHERE id = 1", params)
    return get_child_profile()


# ── Learning Controls ─────────────────────────────────────────────

def get_learning_controls() -> dict:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM learning_controls WHERE id = 1").fetchone()
        if not row:
            return {}
        data = dict(row)
        data["target_topics"] = json.loads(data["target_topics"])
        data["banned_topics"] = json.loads(data["banned_topics"])
        return data


def update_learning_controls(target_topics: list = None, banned_topics: list = None) -> dict:
    updates, params = [], []
    if target_topics is not None:
        updates.append("target_topics = ?")
        params.append(json.dumps(target_topics))
    if banned_topics is not None:
        updates.append("banned_topics = ?")
        params.append(json.dumps(banned_topics))
    if not updates:
        return get_learning_controls()
    with get_db() as conn:
        conn.execute(f"UPDATE learning_controls SET {', '.join(updates)} WHERE id = 1", params)
    return get_learning_controls()


# ── Schedules ─────────────────────────────────────────────────────

def get_schedules() -> dict:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM schedules WHERE id = 1").fetchone()
        return dict(row) if row else {}


def update_schedules(
    quiet_hours_enabled: bool = None,
    quiet_start: str = None,
    quiet_end: str = None,
    weekday_enabled: bool = None,
    weekend_enabled: bool = None,
    daily_limit_minutes: int = None,
) -> dict:
    updates, params = [], []
    if quiet_hours_enabled is not None:
        updates.append("quiet_hours_enabled = ?")
        params.append(int(quiet_hours_enabled))
    if quiet_start is not None:
        updates.append("quiet_start = ?")
        params.append(quiet_start)
    if quiet_end is not None:
        updates.append("quiet_end = ?")
        params.append(quiet_end)
    if weekday_enabled is not None:
        updates.append("weekday_enabled = ?")
        params.append(int(weekday_enabled))
    if weekend_enabled is not None:
        updates.append("weekend_enabled = ?")
        params.append(int(weekend_enabled))
    if daily_limit_minutes is not None:
        updates.append("daily_limit_minutes = ?")
        params.append(int(daily_limit_minutes))
    if not updates:
        return get_schedules()
    with get_db() as conn:
        conn.execute(f"UPDATE schedules SET {', '.join(updates)} WHERE id = 1", params)
    return get_schedules()


def is_quiet_hours_active() -> bool:
    """Check if the current time falls within the configured quiet hours window."""
    sched = get_schedules()
    if not sched.get("quiet_hours_enabled"):
        return False

    now = datetime.now()
    is_weekend = now.weekday() >= 5  # Saturday=5, Sunday=6

    if is_weekend and not sched.get("weekend_enabled"):
        return False
    if not is_weekend and not sched.get("weekday_enabled"):
        return False

    current_time = now.strftime("%H:%M")
    start = sched["quiet_start"]
    end = sched["quiet_end"]

    # Handle overnight spans (e.g. 20:00 → 07:00)
    if start <= end:
        return start <= current_time <= end
    else:
        return current_time >= start or current_time <= end


# ── Device Status ─────────────────────────────────────────────────

def set_device_online(ip_address: str = None):
    with get_db() as conn:
        conn.execute(
            "UPDATE device_status SET is_online = 1, last_connected_at = ?, ip_address = ? WHERE id = 1",
            (datetime.now().isoformat(), ip_address),
        )


def set_device_offline():
    with get_db() as conn:
        conn.execute("UPDATE device_status SET is_online = 0 WHERE id = 1")


def get_device_status() -> dict:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM device_status WHERE id = 1").fetchone()
        return dict(row) if row else {}


# ── Usage Logs ────────────────────────────────────────────────────

def log_session_duration(duration_seconds: float):
    today = date.today().isoformat()
    with get_db() as conn:
        conn.execute(
            "INSERT INTO usage_logs (session_date, duration_seconds) VALUES (?, ?)",
            (today, duration_seconds),
        )


def get_daily_screen_time(target_date: str = None) -> float:
    """Returns total usage time in seconds for a given date (defaults to today)."""
    target = target_date or date.today().isoformat()
    with get_db() as conn:
        row = conn.execute(
            "SELECT COALESCE(SUM(duration_seconds), 0) as total FROM usage_logs WHERE session_date = ?",
            (target,),
        ).fetchone()
        return row["total"] if row else 0.0

get_daily_usage_time = get_daily_screen_time


def get_weekly_screen_time() -> list:
    """Returns usage time for the past 7 days as a list of {date, total_seconds}."""
    with get_db() as conn:
        rows = conn.execute("""
            SELECT session_date, COALESCE(SUM(duration_seconds), 0) as total_seconds
            FROM usage_logs
            WHERE session_date >= date('now', '-7 days')
            GROUP BY session_date
            ORDER BY session_date
        """).fetchall()
        return [dict(r) for r in rows]

get_weekly_usage_time = get_weekly_screen_time


# ── Topic Logs ────────────────────────────────────────────────────

def log_topic(topic: str, question: str = None):
    with get_db() as conn:
        conn.execute(
            "INSERT INTO topic_logs (topic, question) VALUES (?, ?)",
            (topic, question),
        )


def get_weekly_topic_distribution() -> list:
    """Returns topic counts for the past 7 days for pie chart."""
    with get_db() as conn:
        rows = conn.execute("""
            SELECT topic, COUNT(*) as count
            FROM topic_logs
            WHERE logged_at >= datetime('now', '-7 days')
            GROUP BY topic
            ORDER BY count DESC
        """).fetchall()
        return [dict(r) for r in rows]


def get_curiosity_highlights(limit: int = 10) -> list:
    """Returns the most recent unique questions for the highlights card."""
    with get_db() as conn:
        rows = conn.execute("""
            SELECT question, topic, logged_at
            FROM topic_logs
            WHERE question IS NOT NULL AND question != ''
            AND logged_at >= datetime('now', '-7 days')
            ORDER BY logged_at DESC
            LIMIT ?
        """, (limit,)).fetchall()
        return [dict(r) for r in rows]
