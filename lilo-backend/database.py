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
    """Create all tables and seed defaults if they don't exist."""
    with get_db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS child_profile (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                child_name TEXT NOT NULL DEFAULT 'Buddy',
                age INTEGER NOT NULL DEFAULT 7 CHECK (age BETWEEN 5 AND 10),
                hinglish_ratio TEXT NOT NULL DEFAULT 'moderate_hinglish'
                    CHECK (hinglish_ratio IN ('english_only', 'moderate_hinglish', 'high_hinglish'))
            );

            CREATE TABLE IF NOT EXISTS learning_controls (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                target_topics TEXT NOT NULL DEFAULT '["science_space","indian_culture","math_riddles","moral_stories","animals_nature"]',
                banned_topics TEXT NOT NULL DEFAULT '[]'
            );

            CREATE TABLE IF NOT EXISTS schedules (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                quiet_hours_enabled INTEGER NOT NULL DEFAULT 0,
                quiet_start TEXT NOT NULL DEFAULT '20:00',
                quiet_end TEXT NOT NULL DEFAULT '07:00',
                weekday_enabled INTEGER NOT NULL DEFAULT 1,
                weekend_enabled INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS device_status (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                is_online INTEGER NOT NULL DEFAULT 0,
                last_connected_at TEXT,
                ip_address TEXT
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

            -- Seed defaults (INSERT OR IGNORE ensures one-time only)
            INSERT OR IGNORE INTO child_profile (id) VALUES (1);
            INSERT OR IGNORE INTO learning_controls (id) VALUES (1);
            INSERT OR IGNORE INTO schedules (id) VALUES (1);
            INSERT OR IGNORE INTO device_status (id) VALUES (1);
        """)
    logger.info(f"LILO Parent DB initialized at {DB_PATH}")


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
    """Returns total screen time in seconds for a given date (defaults to today)."""
    target = target_date or date.today().isoformat()
    with get_db() as conn:
        row = conn.execute(
            "SELECT COALESCE(SUM(duration_seconds), 0) as total FROM usage_logs WHERE session_date = ?",
            (target,),
        ).fetchone()
        return row["total"] if row else 0.0


def get_weekly_screen_time() -> list:
    """Returns screen time for the past 7 days as a list of {date, total_seconds}."""
    with get_db() as conn:
        rows = conn.execute("""
            SELECT session_date, COALESCE(SUM(duration_seconds), 0) as total_seconds
            FROM usage_logs
            WHERE session_date >= date('now', '-7 days')
            GROUP BY session_date
            ORDER BY session_date
        """).fetchall()
        return [dict(r) for r in rows]


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
