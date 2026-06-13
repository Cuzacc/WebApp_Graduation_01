from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, JSON
from datetime import datetime
from database import Base

class Wish(Base):
    __tablename__ = "wishes"
    
    id = Column(Integer, primary_key=True, index=True)
    sender_name = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    image_url = Column(String, nullable=True) # Legacy single image url
    image_urls = Column(JSON, nullable=True) # Multiple image urls
    photographer_tag = Column(String, nullable=True)
    attendance_status = Column(String, default="attending") # attending or absent
    is_approved = Column(Boolean, default=False, index=True)
    is_deleted = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

class Setting(Base):
    __tablename__ = "settings"
    
    key = Column(String, primary_key=True, index=True)
    value = Column(Text, nullable=False)

class AdminSession(Base):
    __tablename__ = "admin_sessions"
    
    token = Column(String, primary_key=True, index=True)
    username = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)


class TrafficLog(Base):
    __tablename__ = "traffic_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, index=True)
    user_agent = Column(Text)
    endpoint = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)


