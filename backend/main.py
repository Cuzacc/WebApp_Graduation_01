from fastapi import FastAPI, Depends, Request, Header, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timedelta
import time
import hashlib
import os
import secrets
import uuid
from typing import Optional, List

from dotenv import load_dotenv
load_dotenv()

# Import các tiện ích GCS và File
import utils
from utils import upload_to_gcs

GCS_BUCKET_NAME = os.getenv("GCS_BUCKET_NAME")

import models, schemas, database
from database import engine, get_db

def init_db(db_engine):
    # Tự động tạo thư mục uploads lưu trữ ảnh cục bộ
    os.makedirs("uploads", exist_ok=True)
    
    # Tạo bảng dữ liệu nếu chưa có
    models.Base.metadata.create_all(bind=db_engine)
    
    # Tự động chạy di chuyển (migration) dữ liệu cũ
    with db_engine.connect() as conn:
        # Add image_urls column if not exists in wishes table
        conn.execute(text("ALTER TABLE wishes ADD COLUMN IF NOT EXISTS image_urls JSONB;"))
        # Migrate single image_url to image_urls JSON array for legacy rows
        conn.execute(text("""
            UPDATE wishes 
            SET image_urls = json_build_array(image_url) 
            WHERE image_url IS NOT NULL AND image_urls IS NULL;
        """))
        # Create indexes for optimized performance
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_wishes_approved_deleted ON wishes(is_approved, is_deleted);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_wishes_created_at ON wishes(created_at DESC);"))
        # Clean up expired admin sessions
        conn.execute(text("DELETE FROM admin_sessions WHERE expires_at < (NOW() AT TIME ZONE 'UTC');"))
        conn.commit()

# Khởi chạy database & di chuyển dữ liệu
init_db(engine)

app = FastAPI(title="Graduation Web App API", description="API Backend Server powered by FastAPI")

# Đọc cấu hình origins từ biến môi trường ALLOWED_ORIGINS
allowed_origins_env = os.getenv("ALLOWED_ORIGINS")
if allowed_origins_env:
    origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]
else:
    origins = ["http://localhost:5173", "http://localhost"]

# Cấp quyền gọi chéo API (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Cấu hình Mount static files để phân phối ảnh đã upload
app.mount("/api/static/uploads", StaticFiles(directory="uploads"), name="uploads")

ADMIN_KEY = os.getenv("ADMIN_KEY", secrets.token_hex(32))

@app.get("/api/health", response_model=schemas.SystemHealthResponse)
def health_check(db: Session = Depends(get_db)):
    start_time = time.time()
    db_status = "DOWN"
    try:
        db.execute(text("SELECT 1"))
        db_status = "UP"
    except Exception:
        db_status = "DOWN"
    latency = int((time.time() - start_time) * 1000)
    app_status = "UP" if db_status == "UP" else "DOWN"
    return schemas.SystemHealthResponse(
        status=app_status,
        db=db_status,
        latency_ms=latency
    )


# ==================== PUBLIC ENDPOINTS ====================

@app.get("/api/settings")
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(models.Setting).all()
    settings_dict = {s.key: s.value for s in settings}
    
    # Thiết lập giá trị mặc định nếu chưa có cấu hình trong DB
    if "graduation_time" not in settings_dict:
        settings_dict["graduation_time"] = "2026-06-15T08:00:00"
    if "current_location" not in settings_dict:
        settings_dict["current_location"] = "Cổng Trường"
        
    return settings_dict

@app.get("/api/wishes", response_model=List[schemas.WishResponse])
def get_wishes(db: Session = Depends(get_db)):
    return db.query(models.Wish).filter(
        models.Wish.is_approved == True,
        models.Wish.is_deleted == False
    ).order_by(models.Wish.created_at.desc()).all()

@app.post("/api/wishes", response_model=schemas.WishResponse)
def create_wish(
    sender_name: str = Form(...),
    message: str = Form(...),
    photographer_tag: Optional[str] = Form(None),
    attendance_status: Optional[str] = Form("attending"),
    files: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db)
):
    # Validate input string lengths to prevent buffer/disk overflow DOS attacks
    if not sender_name or len(sender_name.strip()) == 0 or len(sender_name) > 100:
        raise HTTPException(status_code=400, detail="Tên người gửi không được trống và tối đa 100 ký tự.")
    if not message or len(message.strip()) == 0 or len(message) > 2000:
        raise HTTPException(status_code=400, detail="Lời chúc không được trống và tối đa 2000 ký tự.")
    if photographer_tag and len(photographer_tag) > 100:
        raise HTTPException(status_code=400, detail="Nguồn ảnh/phó nháy tối đa 100 ký tự.")
    if attendance_status and len(attendance_status) > 100:
        raise HTTPException(status_code=400, detail="Trạng thái tham dự tối đa 100 ký tự.")

    image_urls = []
    ALLOWED_EXTENSIONS = {
        # Định dạng ảnh
        '.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic',
        # Định dạng video
        '.mp4', '.mov', '.avi', '.mkv', '.webm'
    }
    if files:
        for file in files:
            if file and file.filename:
                file_ext = os.path.splitext(file.filename)[1].lower()
                if file_ext not in ALLOWED_EXTENSIONS:
                    raise HTTPException(status_code=400, detail="Định dạng file không hợp lệ. Chỉ chấp nhận ảnh & video!")
                
                if GCS_BUCKET_NAME:
                    # Upload trực tiếp lên Google Cloud Storage (GCP Production)
                    url = upload_to_gcs(file, GCS_BUCKET_NAME)
                    image_urls.append(url)
                else:
                    # Fallback lưu cục bộ (Local Development)
                    unique_filename = f"{uuid.uuid4().hex}{file_ext}"
                    file_path = os.path.join("uploads", unique_filename)
                    
                    # Ghi file vật lý lên đĩa
                    with open(file_path, "wb") as buffer:
                        buffer.write(file.file.read())
                        
                    image_urls.append(f"/api/static/uploads/{unique_filename}")

    new_wish = models.Wish(
        sender_name=sender_name,
        message=message,
        image_url=image_urls[0] if image_urls else None, # Legacy single image url fallback
        image_urls=image_urls if image_urls else None, # List of urls
        photographer_tag=photographer_tag,
        attendance_status=attendance_status,
        is_approved=False,  # Mặc định đợi duyệt
        is_deleted=False
    )
    db.add(new_wish)
    db.commit()
    db.refresh(new_wish)
    return new_wish


# ==================== ADMIN ENDPOINTS ====================

def verify_admin(
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key"),
    db: Session = Depends(get_db)
):
    # 1. Kiểm tra khóa tĩnh cũ (để tương thích ngược)
    if x_admin_key == ADMIN_KEY:
        return x_admin_key
        
    # 2. Kiểm tra session token động trong database
    if x_admin_key:
        session = db.query(models.AdminSession).filter(models.AdminSession.token == x_admin_key).first()
        if session and session.expires_at > datetime.utcnow():
            return x_admin_key
            
    raise HTTPException(status_code=401, detail="Quyền truy cập bị từ chối")

@app.post("/api/admin/login", response_model=schemas.LoginResponse)
def admin_login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    admin_user = os.getenv("ADMIN_USERNAME", "admin")
    admin_pass = os.getenv("ADMIN_PASSWORD", "graduation2026")
    
    if payload.username != admin_user or payload.password != admin_pass:
        raise HTTPException(status_code=401, detail="Sai tài khoản hoặc mật khẩu")
    
    # Tạo session token ngẫu nhiên cực kỳ an toàn
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=24) # Thời hạn 24 giờ
    
    db_session = models.AdminSession(
        token=token,
        username=payload.username,
        expires_at=expires_at
    )
    db.add(db_session)
    db.commit()
    return schemas.LoginResponse(session_token=token)


@app.post("/api/admin/settings")
def update_settings(
    payload: dict,
    admin_key: str = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    for k, v in payload.items():
        db_setting = db.query(models.Setting).filter(models.Setting.key == k).first()
        if db_setting:
            db_setting.value = str(v)
        else:
            db_setting = models.Setting(key=k, value=str(v))
            db.add(db_setting)
    db.commit()
    return {"status": "success"}

@app.get("/api/admin/wishes", response_model=List[schemas.WishResponse])
def get_admin_wishes(
    admin_key: str = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    return db.query(models.Wish).filter(
        models.Wish.is_deleted == False
    ).order_by(models.Wish.created_at.desc()).all()

@app.get("/api/admin/wishes/trash", response_model=List[schemas.WishResponse])
def get_admin_trash(
    admin_key: str = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    return db.query(models.Wish).filter(
        models.Wish.is_deleted == True
    ).order_by(models.Wish.created_at.desc()).all()

@app.post("/api/admin/wishes/{id}/approve")
def toggle_approve_wish(
    id: int,
    admin_key: str = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    wish = db.query(models.Wish).filter(models.Wish.id == id).first()
    if not wish:
        raise HTTPException(status_code=404, detail="Không tìm thấy thiệp")
    wish.is_approved = not wish.is_approved
    db.commit()
    return {"status": "success", "is_approved": wish.is_approved}

@app.post("/api/admin/wishes/{id}/delete")
def soft_delete_wish(
    id: int,
    admin_key: str = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    wish = db.query(models.Wish).filter(models.Wish.id == id).first()
    if not wish:
        raise HTTPException(status_code=404, detail="Không tìm thấy thiệp")
    wish.is_deleted = True
    wish.is_approved = False  # Rút ngay khỏi bảng tin
    db.commit()
    return {"status": "success"}

@app.post("/api/admin/wishes/{id}/restore")
def restore_wish(
    id: int,
    admin_key: str = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    wish = db.query(models.Wish).filter(models.Wish.id == id).first()
    if not wish:
        raise HTTPException(status_code=404, detail="Không tìm thấy thiệp")
    wish.is_deleted = False
    db.commit()
    return {"status": "success"}

@app.delete("/api/admin/wishes/{id}/hard")
def hard_delete_wish(
    id: int,
    admin_key: str = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    wish = db.query(models.Wish).filter(models.Wish.id == id).first()
    if not wish:
        raise HTTPException(status_code=404, detail="Không tìm thấy thiệp")
    
    # Gom toàn bộ URL ảnh/video liên quan để xóa sạch
    urls_to_delete = []
    if wish.image_urls:
        if isinstance(wish.image_urls, list):
            urls_to_delete.extend(wish.image_urls)
    if wish.image_url and wish.image_url not in urls_to_delete:
        urls_to_delete.append(wish.image_url)
        
    # Gọi tiện ích dọn dẹp vật lý trên Local hoặc GCS
    if urls_to_delete:
        utils.delete_media_files(urls_to_delete)
                
    db.delete(wish)
    db.commit()
    return {"status": "success"}


@app.get("/api/admin/stats", response_model=schemas.AdminStatsResponse)
def get_admin_stats(
    admin_key: str = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    total_attending = db.query(models.Wish).filter(
        models.Wish.is_deleted == False,
        models.Wish.attendance_status == "attending"
    ).count()
    
    total_absent = db.query(models.Wish).filter(
        models.Wish.is_deleted == False,
        models.Wish.attendance_status == "absent"
    ).count()
    
    total_wishes = db.query(models.Wish).filter(models.Wish.is_deleted == False).count()
    
    total_images = db.query(models.Wish).filter(
        models.Wish.is_deleted == False,
        models.Wish.image_url.isnot(None)
    ).count()
    
    return schemas.AdminStatsResponse(
        total_attending=total_attending,
        total_absent=total_absent,
        total_wishes=total_wishes,
        total_images=total_images
    )
