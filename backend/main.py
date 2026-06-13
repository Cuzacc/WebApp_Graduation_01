from fastapi import FastAPI, Depends, Request, Header, HTTPException, File, UploadFile, Form, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, StreamingResponse
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
import requests
from urllib.parse import urlparse

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


@app.middleware("http")
async def log_traffic_middleware(request: Request, call_next):
    response = await call_next(request)
    
    path = request.url.path
    if not (
        path.startswith("/api/static") 
        or path.startswith("/assets") 
        or path.startswith("/api/admin")
        or request.headers.get("X-Admin-Key")
        or "." in path.split("/")[-1]
    ):
        db = None
        try:
            from database import SessionLocal
            db = SessionLocal()
            ip = request.headers.get("X-Forwarded-For") or (request.client.host if request.client else "unknown")
            if ip and "," in ip:
                ip = ip.split(",")[0].strip()
            user_agent = request.headers.get("user-agent", "Unknown")
            
            log_entry = models.TrafficLog(
                ip_address=ip,
                user_agent=user_agent,
                endpoint=path
            )
            db.add(log_entry)
            db.commit()
        except Exception as e:
            print(f"Lỗi ghi log truy cập: {e}")
        finally:
            if db:
                db.close()
            
    return response


# Cấu hình Mount static files để phân phối ảnh đã upload
app.mount("/api/static/uploads", StaticFiles(directory="uploads"), name="uploads")

# WebSocket Connection Manager for Real-time Reactions
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass

manager = ConnectionManager()

@app.websocket("/api/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Broadcast reaction to all other connected clients
            await manager.broadcast(data)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

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
        settings_dict["graduation_time"] = "2026-06-16T08:00:00"
    if "current_location" not in settings_dict:
        settings_dict["current_location"] = "Đại học Duy Tân 03 Quang Trung Đà Nẵng"
    if "time_mock_mode" not in settings_dict:
        settings_dict["time_mock_mode"] = "real"
    if "location_title" not in settings_dict:
        settings_dict["location_title"] = "Hội trường chính"
    if "location_subtitle" not in settings_dict:
        settings_dict["location_subtitle"] = "Đại học Duy Tân 03 Quang Trung Đà Nẵng"
    if "location_parking" not in settings_dict:
        settings_dict["location_parking"] = "🚗 Thông tin đỗ xe: Khách gửi xe tại bãi gửi xe của trường Đại học Duy Tân."
    if "site_title" not in settings_dict:
        settings_dict["site_title"] = "QUANG TÙNG GRADUATION"
    if "invitation_desc" not in settings_dict:
        settings_dict["invitation_desc"] = "Sự hiện diện của mọi người là niềm vinh dự và là nguồn động viên to lớn để Tùng vững bước trên chặng đường sắp tới. Trân trọng kính mời mọi người đến tham dự và chung vui cùng Tùng trong buổi lễ tốt nghiệp đầy ý nghĩa này."
        
    # Bổ sung server_time (UTC+7 hoặc múi giờ hệ thống hiện tại)
    settings_dict["server_time"] = datetime.now().isoformat()
    return settings_dict

@app.get("/api/download")
def download_file(url: str):
    try:
        # 1. Nếu là ảnh ở local (ví dụ chứa /uploads/)
        parsed_url = urlparse(url)
        path_parts = parsed_url.path.split("/uploads/")
        if len(path_parts) > 1:
            local_filename = os.path.basename(path_parts[1])
            local_path = os.path.abspath(os.path.join("uploads", local_filename))
            
            # Kiểm tra xem đường dẫn tệp tin có nằm trong uploads không
            if not local_path.startswith(os.path.abspath("uploads")):
                raise HTTPException(status_code=400, detail="Đường dẫn không hợp lệ")
                
            # Docker container path check
            docker_path = os.path.join("/app/uploads", local_filename)
            if os.path.exists(docker_path):
                local_path = docker_path
                
            if os.path.exists(local_path):
                return FileResponse(
                    local_path,
                    media_type="application/octet-stream",
                    filename=local_filename
                )
        
        # 2. Nếu là ảnh ở GCP Storage hoặc link ngoài khác
        if not url.startswith("http://") and not url.startswith("https://"):
            raise HTTPException(status_code=400, detail="URL không hợp lệ")
            
        # Chống SSRF: Chỉ cho phép tải từ Google Cloud Storage hoặc domain cục bộ
        parsed_external_url = urlparse(url)
        if parsed_external_url.netloc and not parsed_external_url.netloc.endswith("storage.googleapis.com"):
            raise HTTPException(status_code=400, detail="Không hỗ trợ tải tệp từ nguồn này")
            
        res = requests.get(url, stream=True, timeout=15)
        if res.status_code != 200:
            raise HTTPException(status_code=400, detail="Không thể tải file từ nguồn cung cấp")
        
        filename = os.path.basename(parsed_external_url.path) or "downloaded_file"
        
        def iter_content():
            for chunk in res.iter_content(chunk_size=8192):
                if chunk:
                    yield chunk

        return StreamingResponse(
            iter_content(),
            media_type=res.headers.get("Content-Type", "application/octet-stream"),
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi tải xuống: {str(e)}")

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
                
                # Giới hạn dung lượng: Ảnh tối đa 15MB, Video tối đa 50MB
                file.file.seek(0, 2)
                size = file.file.tell()
                file.file.seek(0)
                
                is_video = file_ext in {'.mp4', '.mov', '.avi', '.mkv', '.webm'}
                max_size = 50 * 1024 * 1024 if is_video else 15 * 1024 * 1024
                if size > max_size:
                    label = "Video" if is_video else "Ảnh"
                    limit_mb = 50 if is_video else 15
                    raise HTTPException(
                        status_code=400, 
                        detail=f"{label} vượt quá dung lượng cho phép (tối đa {limit_mb}MB)."
                    )
                
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


@app.post("/api/admin/upload")
def admin_upload(
    file: UploadFile = File(...),
    admin_key: str = Depends(verify_admin)
):
    # Ràng buộc dung lượng upload của Admin: tối đa 15MB
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    if size > 15 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Ảnh tải lên vượt quá giới hạn 15MB.")

    if GCS_BUCKET_NAME:
        url = upload_to_gcs(file, GCS_BUCKET_NAME)
    else:
        file_ext = os.path.splitext(file.filename)[1].lower()
        unique_filename = f"{uuid.uuid4().hex}{file_ext}"
        file_path = os.path.join("uploads", unique_filename)
        with open(file_path, "wb") as buffer:
            buffer.write(file.file.read())
        url = f"/api/static/uploads/{unique_filename}"
    return {"url": url}


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


@app.get("/api/admin/traffic")
def get_traffic_stats(
    limit: int = 20,
    admin_key: str = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    # 1. Active Users (last 5 minutes)
    five_mins_ago = datetime.utcnow() - timedelta(minutes=5)
    from sqlalchemy import func
    active_users = db.query(func.count(func.distinct(models.TrafficLog.ip_address))).filter(
        models.TrafficLog.timestamp >= five_mins_ago
    ).scalar() or 0
    
    # 2. Total Views & Visitors
    total_views = db.query(func.count(models.TrafficLog.id)).scalar() or 0
    total_visitors = db.query(func.count(func.distinct(models.TrafficLog.ip_address))).scalar() or 0
    
    # 3. Recent Logs (last 20)
    recent_records = db.query(models.TrafficLog).order_by(models.TrafficLog.timestamp.desc()).limit(limit).all()
    recent_logs = []
    for r in recent_records:
        recent_logs.append({
            "id": r.id,
            "ip_address": r.ip_address,
            "user_agent": r.user_agent,
            "endpoint": r.endpoint,
            "timestamp": r.timestamp.isoformat() + "Z"
        })
        
    # 4. Device Stats (parsed from last 500 logs)
    recent_for_devices = db.query(models.TrafficLog.user_agent).order_by(models.TrafficLog.timestamp.desc()).limit(500).all()
    mobile_keywords = ["Mobi", "Android", "iPhone", "iPad", "Windows Phone"]
    mobile_count = 0
    desktop_count = 0
    for (ua,) in recent_for_devices:
        ua_str = ua or ""
        if any(k in ua_str for k in mobile_keywords):
            mobile_count += 1
        else:
            desktop_count += 1
            
    # 5. Top Endpoints
    endpoint_counts = db.query(
        models.TrafficLog.endpoint, 
        func.count(models.TrafficLog.id).label("count")
    ).group_by(models.TrafficLog.endpoint).order_by(func.count(models.TrafficLog.id).desc()).limit(5).all()
    
    top_endpoints = [{"path": ec[0], "count": ec[1]} for ec in endpoint_counts]
    
    return {
        "active_users": active_users,
        "total_views": total_views,
        "total_visitors": total_visitors,
        "recent_logs": recent_logs,
        "device_stats": {
            "mobile": mobile_count,
            "desktop": desktop_count
        },
        "top_endpoints": top_endpoints
    }


@app.get("/api/admin/traffic/export")
def export_traffic_logs(
    admin_key: str = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    import csv
    import io
    from datetime import timedelta
    
    logs = db.query(models.TrafficLog).order_by(models.TrafficLog.timestamp.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Thời gian (UTC)", "Thời gian (Việt Nam)", "Địa chỉ IP", "Đường dẫn", "Thiết bị / User-Agent"])
    
    for log in logs:
        vn_time = log.timestamp + timedelta(hours=7)
        writer.writerow([
            log.timestamp.isoformat() + "Z",
            vn_time.strftime("%Y-%m-%d %H:%M:%S"),
            log.ip_address,
            log.endpoint,
            log.user_agent
        ])
        
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8-sig")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=traffic_logs.csv"}
    )
