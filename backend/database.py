import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Hỗ trợ tự động chuyển sang SQLite khi chạy local/test không có PostgreSQL
if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./graduation.db"
    # sqlite yêu cầu thêm connect_args cho xử lý đa luồng an toàn
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
