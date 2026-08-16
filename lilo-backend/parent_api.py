"""
LILO Voice Assistant — Parent Portal REST API

FastAPI router providing endpoints for the parent management dashboard.
"""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List

from database import (
    get_child_profile, update_child_profile,
    get_learning_controls, update_learning_controls,
    get_schedules, update_schedules,
    get_device_status, get_daily_screen_time, get_weekly_screen_time,
    get_weekly_topic_distribution, get_curiosity_highlights,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/parent", tags=["Parent Portal"])


# ── Pydantic Models ───────────────────────────────────────────────

class ChildProfileUpdate(BaseModel):
    child_name: Optional[str] = None
    age: Optional[int] = Field(None, ge=5, le=15)
    hinglish_ratio: Optional[str] = Field(None, pattern=r"^(english_only|hindi_only|moderate_hinglish|high_hinglish)$")


class LearningControlsUpdate(BaseModel):
    target_topics: Optional[List[str]] = None
    banned_topics: Optional[List[str]] = None


class SchedulesUpdate(BaseModel):
    quiet_hours_enabled: Optional[bool] = None
    quiet_start: Optional[str] = Field(None, pattern=r"^\d{2}:\d{2}$")
    quiet_end: Optional[str] = Field(None, pattern=r"^\d{2}:\d{2}$")
    weekday_enabled: Optional[bool] = None
    weekend_enabled: Optional[bool] = None
    daily_limit_minutes: Optional[int] = Field(None, ge=15, le=300)


# ── Dashboard ─────────────────────────────────────────────────────

@router.get("/dashboard")
async def dashboard():
    """Returns live device status, daily usage time, and weekly trends."""
    device = get_device_status()
    daily_seconds = get_daily_screen_time()
    weekly = get_weekly_screen_time()
    profile = get_child_profile()
    schedules = get_schedules()

    usage_data = {
        "today_seconds": daily_seconds,
        "today_minutes": round(daily_seconds / 60, 1),
        "daily_limit_minutes": schedules.get("daily_limit_minutes", 60),
        "weekly": weekly,
    }

    return {
        "device": {
            "is_online": bool(device.get("is_online", 0)),
            "last_connected_at": device.get("last_connected_at"),
            "ip_address": device.get("ip_address"),
        },
        "usage_time": usage_data,
        "screen_time": usage_data,
        "child_name": profile.get("child_name", "Aarav"),
        "quiet_hours_enabled": bool(schedules.get("quiet_hours_enabled", 0)),
    }


# ── Child Profile ────────────────────────────────────────────────

@router.get("/profile")
async def get_profile():
    """Returns the current child profile settings."""
    profile = get_child_profile()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.post("/profile")
async def post_profile(data: ChildProfileUpdate):
    """Updates child profile settings."""
    updated = update_child_profile(
        child_name=data.child_name,
        age=data.age,
        hinglish_ratio=data.hinglish_ratio,
    )
    logger.info(f"Child profile updated: {updated}")
    return updated


# ── Learning Controls ────────────────────────────────────────────

@router.get("/learning-controls")
async def get_controls():
    """Returns the current learning controls configuration."""
    controls = get_learning_controls()
    if not controls:
        raise HTTPException(status_code=404, detail="Learning controls not found")
    return controls


@router.post("/learning-controls")
async def post_controls(data: LearningControlsUpdate):
    """Updates target learning topics and banned topics."""
    updated = update_learning_controls(
        target_topics=data.target_topics,
        banned_topics=data.banned_topics,
    )
    logger.info(f"Learning controls updated: {updated}")
    return updated


# ── Schedules ─────────────────────────────────────────────────────

@router.get("/schedules")
async def get_schedule():
    """Returns the current quiet hours / bedtime schedule."""
    sched = get_schedules()
    if not sched:
        raise HTTPException(status_code=404, detail="Schedules not found")
    # Convert SQLite integers to booleans for frontend
    return {
        **sched,
        "quiet_hours_enabled": bool(sched.get("quiet_hours_enabled", 0)),
        "weekday_enabled": bool(sched.get("weekday_enabled", 1)),
        "weekend_enabled": bool(sched.get("weekend_enabled", 0)),
    }


@router.post("/schedules")
async def post_schedule(data: SchedulesUpdate):
    """Updates the quiet hours / bedtime schedule configuration."""
    updated = update_schedules(
        quiet_hours_enabled=data.quiet_hours_enabled,
        quiet_start=data.quiet_start,
        quiet_end=data.quiet_end,
        weekday_enabled=data.weekday_enabled,
        weekend_enabled=data.weekend_enabled,
        daily_limit_minutes=data.daily_limit_minutes,
    )
    logger.info(f"Schedules updated: {updated}")
    return {
        **updated,
        "quiet_hours_enabled": bool(updated.get("quiet_hours_enabled", 0)),
        "weekday_enabled": bool(updated.get("weekday_enabled", 1)),
        "weekend_enabled": bool(updated.get("weekend_enabled", 0)),
    }


# ── Reports & Analytics ──────────────────────────────────────────

@router.get("/reports")
async def get_reports():
    """Returns weekly topic distribution and curiosity highlights for analytics."""
    weekly = get_weekly_screen_time()
    return {
        "topic_distribution": get_weekly_topic_distribution(),
        "curiosity_highlights": get_curiosity_highlights(limit=10),
        "weekly_usage_time": weekly,
        "weekly_screen_time": weekly,
    }
