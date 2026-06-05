from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class SystemHealthResponse(BaseModel):
    status: str
    db: str
    latency_ms: int

class WishCreate(BaseModel):
    sender_name: str
    message: str
    photographer_tag: Optional[str] = None
    attendance_status: Optional[str] = "attending"

class WishResponse(BaseModel):
    id: int
    sender_name: str
    message: str
    image_url: Optional[str] = None
    image_urls: Optional[List[str]] = None
    photographer_tag: Optional[str] = None
    attendance_status: str
    is_approved: bool
    is_deleted: bool
    created_at: datetime

    class Config:
        from_attributes = True

class SettingResponse(BaseModel):
    key: str
    value: str

    class Config:
        from_attributes = True

class SettingUpdate(BaseModel):
    value: str

class AdminStatsResponse(BaseModel):
    total_attending: int
    total_absent: int
    total_wishes: int
    total_images: int

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    session_token: str

