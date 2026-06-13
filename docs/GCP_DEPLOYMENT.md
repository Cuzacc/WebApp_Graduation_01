# Hướng Dẫn Cấu Hình Hạ Tầng & Triển Khai Trên Google Cloud Platform (GCP)

Tài liệu này hướng dẫn cậu từng bước thiết lập hạ tầng chuẩn doanh nghiệp (VPC, Cloud SQL, Cloud Storage, Compute Engine VM) trên GCP và chạy ứng dụng một cách an toàn nhất.

---

## 🏛️ Sơ đồ thiết lập bảo mật trên GCP
*   **Database (Cloud SQL):** Chỉ có địa chỉ IP mạng nội bộ (VPC Private IP), không thể truy cập từ bên ngoài Internet.
*   **Bảo mật Bucket (Cloud Storage):** Khách chỉ được quyền **đọc** tệp (`Storage Object Viewer`), chỉ duy nhất VM của cậu mới có quyền **ghi** tệp (`Storage Object Creator`).
*   **Xác thực không mật mã (Keyless IAM):** VM Compute Engine tự động kết nối tới Storage Bucket bằng Service Account gán trực tiếp, không cần lưu trữ file key JSON nhạy cảm trong mã nguồn.

---

## 📋 Phần 1: Các bước cấu hình trên GCP Console

### Bước 1: Thiết lập Mạng nội bộ (VPC Network)
1.  Vào **VPC Network** > **VPC networks** > Chọn **Create VPC Network**.
    *   Tên mạng: `graduation-vpc`.
    *   Tạo Subnet: Chọn **Custom**, đặt tên `subnet-southeast` ở vùng `asia-southeast1 (Singapore)` hoặc `asia-east1 (Taiwan)`.
2.  Sau khi VPC được tạo, vào mục **Private Service Connection** (nằm trong tab bên trái của VPC):
    *   Chọn **Allocate IP Range**, đặt tên `sql-ip-range` và cấp dải IP `/24` hoặc `/16` tự động.
    *   Chọn **Enabled connection** để liên kết dải IP này với dịch vụ Cloud SQL của Google.

### Bước 2: Tạo Cơ sở dữ liệu (GCP Cloud SQL)
1.  Vào **SQL** > Chọn **Create Instance** > Chọn **PostgreSQL**.
2.  Thiết lập thông số instance:
    *   Instance ID: `quangtung-db`.
    *   Password: Nhập mật khẩu quản trị (Lưu lại để điền vào `.env`).
    *   Database version: **PostgreSQL 15** (hoặc 14/16).
    *   Chọn cấu hình **Lightweight**: Chọn dòng `db-f1-micro` (1 Shared vCPU, 0.6 GB RAM) để tiết kiệm chi phí tối đa.
3.  **Quan trọng - Kết nối (Connections):**
    *   Bỏ chọn **Public IP** (Tắt hoàn toàn cổng truy cập công cộng từ Internet).
    *   Tích chọn **Private IP**. Chọn mạng VPC của cậu: `graduation-vpc`.
4.  Nhấp **Create Instance** và chờ 5-7 phút để Google tạo xong.
5.  Sau khi tạo xong, tạo database tên là `devops_portfolio` tại tab **Databases** và lấy địa chỉ **Private IP Address** hiển thị ở trang tổng quan (ví dụ: `10.128.0.5`).

### Bước 3: Tạo Kho lưu trữ ảnh/video (GCP Cloud Storage)
1.  Vào **Cloud Storage** > **Buckets** > Chọn **Create**.
    *   Đặt tên duy nhất cho Bucket: `quangtung-graduation-bucket`.
    *   Location type: **Region** > Chọn `asia-southeast1 (Singapore)`.
    *   Storage class: **Standard**.
2.  **Bỏ chọn** mục **"Block all public access"** (để cho phép mọi người xem ảnh/video trực tiếp).
3.  Chọn **Uniform** ở mục Access Control, nhấp **Create**.
4.  **Phân quyền đọc công khai (Public Read):**
    *   Sau khi tạo Bucket, vào tab **Permissions** > Chọn **Grant Access**.
    *   New principals: Điền `allUsers`.
    *   Role: Chọn **Cloud Storage** > **Storage Object Viewer** (Chỉ cho phép đọc/tải tệp công khai).
    *   Nhấp **Save** và xác nhận **Allow Public Access**.

### Bước 4: Tạo Service Account kết nối & Tạo VM Compute Engine
1.  Vào **IAM & Admin** > **Service Accounts** > Chọn **Create Service Account**.
    *   Tên: `graduation-vm-sa`.
    *   Cấp quyền (Role): Chọn **Cloud Storage** > **Storage Object Creator** (Chỉ cho phép ghi ảnh/video mới lên Bucket).
2.  Vào **Compute Engine** > **VM Instances** > Chọn **Create Instance**.
    *   Tên VM: `graduation-web-server`.
    *   Vùng (Region): `asia-southeast1 (Singapore)` (Trùng vùng với VPC và Storage).
    *   Cấu hình: Dòng `e2-micro` (2 vCPU, 1 GB RAM - Rất rẻ).
    *   Boot disk: Chọn hệ điều hành **Debian 11/12** hoặc **Ubuntu 22.04 LTS**, dung lượng ổ đĩa **15 GB - SSD**.
    *   Firewall: Tích chọn **Allow HTTP traffic** và **Allow HTTPS traffic**.
3.  **Gán Service Account cho VM:**
    *   Tại mục **Identity and API access**: Chọn Service Account cậu vừa tạo: `graduation-vm-sa`.
4.  Tại mục **Advanced Options** > **Networking**:
    *   Chọn VPC Network: `graduation-vpc` và Subnet tương ứng.
    *   External IP: Chọn **Ephemeral** (hoặc tạo IP tĩnh để trỏ tên miền).
5.  Nhấp **Create** để khởi chạy VM.

---

## 💻 Phần 2: Các bước Deploy dự án trên VM Compute Engine

### Bước 1: SSH vào VM và cài đặt môi trường
1.  Nhấp nút **SSH** ngay cạnh VM trên GCP Console để mở cửa sổ dòng lệnh.
2.  Cập nhật hệ thống và cài đặt Docker + Git:
    ```bash
    sudo apt-get update && sudo apt-get upgrade -y
    
    # Cài đặt Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    
    # Cài đặt Docker Compose (Cập nhật phiên bản mới nhất)
    sudo mkdir -p /usr/local/lib/docker/cli-plugins/
    sudo curl -SL https://github.com/docker/compose/releases/download/v2.22.0/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose
    sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
    
    # Khởi động lại session SSH để nhận quyền chạy docker không cần sudo
    exit
    ```
3.  Nhấp **SSH** mở lại cửa sổ lệnh.

### Bước 2: Clone dự án và cấu hình biến môi trường
1.  Tải mã nguồn dự án của cậu về VM:
    ```bash
    git clone <đường_dẫn_git_repository_của_cậu>
    cd graduation_01
    ```
2.  Tạo và sửa file cấu hình `.env` cho Backend:
    ```bash
    nano backend/.env
    ```
3.  Nhập cấu hình chính thức từ các bước thiết lập GCP ở trên:
    ```env
    # URL kết nối Cloud SQL sử dụng địa chỉ IP nội bộ (Private IP)
    DATABASE_URL=postgresql://devops:mật_khẩu_db_của_cậu@<IP_NỘI_BỘ_CLOUD_SQL>:5432/devops_portfolio
    
    # Tên Bucket Google Cloud Storage chứa ảnh và video
    GCS_BUCKET_NAME=quangtung-graduation-bucket
    
    # Tài khoản mật khẩu quản trị web
    ADMIN_USERNAME=admin
    ADMIN_PASSWORD=mật_khẩu_admin_của_cậu
    ```
    *(Bấm `Ctrl + O` để lưu, `Enter`, và `Ctrl + X` để thoát nano).*

### Bước 3: Kích hoạt ứng dụng
1.  Chạy lệnh khởi động Docker Compose:
    ```bash
    docker compose up -d --build
    ```
2.  Kiểm tra trạng thái các container:
    ```bash
    docker compose ps
    ```
    *Cần đảm bảo 3 container `devops_backend`, `devops_frontend`, và `devops_nginx` đều ở trạng thái `Up`.*

---

## 🔒 Phần 3: Trỏ tên miền & Cấu hình HTTPS bảo mật

Để cấu hình HTTPS an toàn mà không làm ảnh hưởng đến mã nguồn chạy ở máy local, cậu thực hiện lấy chứng chỉ Let's Encrypt trên máy VM và cấu hình SSL cho Nginx Docker như sau:

### Bước 1: Lấy chứng chỉ SSL Standalone trên Host VM
1. Tạm thời tắt Docker Compose để giải phóng cổng 80:
   ```bash
   docker compose down
   ```
2. Cài đặt Certbot trên máy VM:
   ```bash
   sudo apt-get install certbot -y
   ```
3. Chạy Certbot chế độ Standalone để lấy chứng chỉ:
   ```bash
   sudo certbot certonly --standalone -d ten_mien_cua_cau.com -d www.ten_mien_cua_cau.com
   ```
   *(Nhập Email, đồng ý với điều khoản dịch vụ để hoàn tất. Chứng chỉ sẽ được lưu tại `/etc/letsencrypt/live/ten_mien_cua_cau.com/`)*

### Bước 2: Cập nhật docker-compose.yml trên VM để mở cổng 443 và mount chứng chỉ
Mở file `docker-compose.yml` trên VM:
```bash
nano docker-compose.yml
```
Cập nhật dịch vụ `nginx` để mở cổng `443` và chia sẻ thư mục chứng chỉ `/etc/letsencrypt` từ máy VM vào trong container:
```yaml
  nginx:
    image: nginx:alpine
    container_name: devops_nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - frontend
      - backend
    networks:
      - devops_network
```

### Bước 3: Cập nhật cấu hình nginx/nginx.conf trên VM để kích hoạt SSL
Mở file cấu hình Nginx trên VM:
```bash
nano nginx/nginx.conf
```
Thay thế toàn bộ nội dung file bằng cấu hình hỗ trợ SSL dưới đây (thay thế `ten_mien_cua_cau.com` bằng tên miền thực tế của cậu):
```nginx
events {
    worker_connections 1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    client_max_body_size 500M;

    # Định nghĩa vùng lưu trữ IP giới hạn đăng nhập Admin
    limit_req_zone $binary_remote_addr zone=admin_login_limit:10m rate=5r/m;

    # Bản đồ kiểm tra phương thức request: chỉ giới hạn rate limit cho phương thức POST (gửi thiệp)
    map $request_method $wishes_limit_key {
        default "";
        POST $binary_remote_addr;
    }

    # Định nghĩa vùng lưu trữ IP giới hạn gửi thiệp chúc (10 yêu cầu/phút chống Spam)
    limit_req_zone $wishes_limit_key zone=wishes_limit:10m rate=10r/m;

    # 1. Chuyển hướng toàn bộ traffic HTTP (cổng 80) sang HTTPS (cổng 443)
    server {
        listen 80;
        server_name ten_mien_cua_cau.com www.ten_mien_cua_cau.com;
        return 301 https://$host$request_uri;
    }

    # 2. Cấu hình HTTPS chính thức
    server {
        listen 443 ssl;
        server_name ten_mien_cua_cau.com www.ten_mien_cua_cau.com;

        # Đường dẫn tới chứng chỉ SSL Let's Encrypt (được mount từ máy VM)
        ssl_certificate /etc/letsencrypt/live/ten_mien_cua_cau.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/ten_mien_cua_cau.com/privkey.pem;

        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # Cấu hình các HTTP Security Header cơ bản
        add_header X-Frame-Options "SAMEORIGIN";
        add_header X-Content-Type-Options "nosniff";
        add_header X-XSS-Protection "1; mode=block";

        # Áp dụng giới hạn tần suất cho API đăng nhập Admin chống Brute-force
        location = /api/admin/login {
            limit_req zone=admin_login_limit burst=3 nodelay;
            limit_req_status 429;
            
            proxy_pass http://backend:8000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
        }

        # Giới hạn tần suất đăng thiệp chúc mới để tránh spam DoS làm tràn ổ đĩa
        location = /api/wishes {
            limit_req zone=wishes_limit burst=5 nodelay;
            limit_req_status 429;
            
            proxy_pass http://backend:8000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
        }

        # Chặn đường dẫn bắt đầu bằng /api cho Python Backend xử lý
        location /api/ {
            proxy_pass http://backend:8000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
        }

        # Trỏ mọi đường dẫn còn lại về Frontend React
        location / {
            proxy_pass http://frontend:80;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
        }
    }
}
```

### Bước 4: Khởi chạy lại Docker Compose
```bash
docker compose up -d --build
```

Chúc mừng cậu! Trang web kỷ niệm của Quang Tùng hiện tại đã được triển khai hoàn chỉnh, bảo mật tối đa với HTTPS và sẵn sàng đón nhận hàng nghìn lời chúc và video từ mọi người!
