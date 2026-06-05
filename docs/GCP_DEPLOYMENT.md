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

1.  Truy cập trang quản lý Tên miền của cậu, trỏ bản ghi **A** về địa chỉ **External IP** (IP công cộng) của VM Compute Engine.
2.  Sau khi tên miền được cập nhật thành công, SSH vào VM và chạy lệnh sau để lấy chứng chỉ Let's Encrypt SSL miễn phí:
    ```bash
    # Chạy certbot trực tiếp bên trong container Nginx để cấu hình HTTPS tự động
    docker compose exec nginx certbot --nginx -d tên_miền_của_cậu.com
    ```
3.  Làm theo hướng dẫn trên màn hình, điền email và chọn chuyển hướng tự động từ HTTP sang HTTPS.

Chúc mừng cậu! Trang web kỷ niệm của Quang Tùng hiện tại đã được triển khai hoàn chỉnh, bảo mật tối đa và sẵn sàng đón nhận hàng nghìn lời chúc và video từ mọi người!
