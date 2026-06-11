import os
import uuid
import urllib.parse
from fastapi import UploadFile, HTTPException
from google.cloud import storage

GCS_BUCKET_NAME = os.getenv("GCS_BUCKET_NAME")

def upload_to_gcs(file: UploadFile, bucket_name: str) -> str:
    try:
        client = storage.Client()
        bucket = client.bucket(bucket_name)
        
        # Sinh tên file độc nhất tránh trùng lặp
        file_ext = os.path.splitext(file.filename)[1].lower()
        unique_filename = f"{uuid.uuid4().hex}{file_ext}"
        
        blob = bucket.blob(unique_filename)
        blob.upload_from_file(file.file, content_type=file.content_type)
        
        return f"https://storage.googleapis.com/{bucket_name}/{unique_filename}"
    except Exception as e:
        print(f"Lỗi upload tệp tin lên Cloud Storage: {e}")
        raise HTTPException(status_code=500, detail="Không thể lưu trữ tệp tin lên Cloud.")

def delete_media_files(urls: list) -> None:
    """
    Xóa danh sách tệp tin ảnh/video khỏi local hoặc GCP Cloud Storage.
    """
    if not urls:
        return
        
    client = None
    bucket = None
    
    for url in urls:
        if not url:
            continue
            
        url_str = str(url)
        # 1. Trường hợp lưu trữ trên GCP Cloud Storage
        if url_str.startswith("https://storage.googleapis.com/") or (GCS_BUCKET_NAME and GCS_BUCKET_NAME in url_str):
            try:
                # Phân tích URL để lấy tên blob
                parsed_url = urllib.parse.urlparse(url_str)
                path_parts = parsed_url.path.strip("/").split("/")
                
                if len(path_parts) >= 2:
                    bucket_name = path_parts[0]
                    blob_name = "/".join(path_parts[1:])
                else:
                    # Dự phòng khi format khác
                    blob_name = path_parts[-1]
                    bucket_name = GCS_BUCKET_NAME
                
                if not client:
                    client = storage.Client()
                if not bucket or bucket.name != bucket_name:
                    bucket = client.bucket(bucket_name)
                
                blob = bucket.blob(blob_name)
                if blob.exists():
                    blob.delete()
                    print(f"Đã xóa thành công tệp tin trên GCS: {blob_name}")
            except Exception as e:
                print(f"Lỗi khi xóa tệp tin trên GCP Cloud Storage ({url_str}): {e}")
                
        # 2. Trường hợp lưu cục bộ
        elif url_str.startswith("/api/static/uploads/") or "uploads/" in url_str:
            try:
                filename = url_str.split("/")[-1]
                file_path = os.path.join("uploads", filename)
                if os.path.exists(file_path):
                    os.remove(file_path)
                    print(f"Đã xóa thành công tệp tin cục bộ: {file_path}")
            except Exception as e:
                print(f"Lỗi khi xóa tệp tin cục bộ ({url_str}): {e}")
