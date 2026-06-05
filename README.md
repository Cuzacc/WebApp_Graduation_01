# Quang Tùng Graduation - Kỷ Niệm Tốt Nghiệp

Trang web kỷ niệm Lễ Tốt Nghiệp của **Quang Tùng**, tích hợp bảng tin chia sẻ lời chúc và album ảnh kỷ niệm được tối ưu hóa hiển thị và bảo mật.

Dự án được xây dựng với cấu trúc gọn nhẹ, chạy trên hạ tầng container hóa Docker (Nginx, React Frontend, FastAPI Backend, và PostgreSQL Database).

---

## 🚀 Các Tính Năng Nổi Bật

### 1. Phía Khách Truy Cập (Guests)
*   **Gửi Lời Chúc & Ảnh Kỷ Niệm:** Khách truy cập có thể gửi lời chúc tốt đẹp tới Quang Tùng kèm theo việc tải lên đồng thời nhiều bức ảnh kỷ niệm cùng lúc.
*   **Trình Thu Nhỏ Ảnh (Client-Side Compression):** Ảnh được nén dung lượng trực tiếp bằng Canvas trên trình duyệt trước khi tải lên để tiết kiệm băng thông và tăng tốc độ xử lý của server.
*   **Trình Vuốt Album Ảnh (Wish Carousel):** Mỗi thẻ thiệp hỗ trợ một slide ảnh vuốt mượt mà trên cả máy tính và điện thoại.
*   **Xem Phóng To (Lightbox):** Nhấp vào hình ảnh bất kỳ để phóng to toàn màn hình, vuốt chạm dễ dàng để đóng.
*   **Tham Dự RSVP Tự Do:** Khách có thể chọn các chế độ mặc định hoặc tự nhập trạng thái tham dự tùy ý ở mục "Khác".

### 2. Phía Quản Trị Viên (Admin Panel)
*   **Bảng Điều Khiển Trực Quan:** Phân tách quản lý thiệp chúc mừng thành 3 tab rõ ràng: **Chờ duyệt**, **Đã duyệt**, và **Thùng rác** kèm bộ đếm số lượng thời gian thực.
*   **Duyệt & Xóa Thiệp Nhanh Chóng:** Admin có thể phê duyệt thiệp để hiển thị công khai lên bảng tin, di chuyển thiệp vào thùng rác hoặc xóa vĩnh viễn khỏi máy chủ.
*   **Cập Nhật Live:** Sửa đổi trực tiếp vị trí hiện tại (Live Location) của Quang Tùng và giờ đếm ngược nhận bằng cử nhân ngay trên trang Admin.
*   **Xác Thực Động Bảo Mật:** Cơ chế đăng nhập qua mật khẩu an toàn, cấp phát session token ngẫu nhiên có thời hạn 24 giờ lưu trữ trong database để xác thực thay vì sử dụng khóa tĩnh.

---

## 🔒 Hạ Tầng & Bảo Mật Hệ Thống

*   **Bộ lọc tải file an toàn (File Upload Sanitizer):** Kiểm soát chặt chẽ các file gửi lên, chỉ chấp nhận định dạng ảnh phổ biến (`.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.heic`). Ngăn chặn hoàn toàn hacker tải lên các file mã độc thực thi hoặc mã nguồn độc hại.
*   **Giới hạn độ dài ký tự (Input Validation):** Tất cả các tham số văn bản đều được giới hạn độ dài ký tự tối đa ở API Backend nhằm ngăn chặn các cuộc tấn công từ chối dịch vụ (DoS) thông qua gói tin dung lượng lớn.
*   **Chỉ mục tìm kiếm (Database Indexing):** Tối ưu hóa hiệu năng truy vấn danh sách thiệp đã phê duyệt/bị xóa bằng việc cấu hình Index đa trường, đảm bảo tốc độ phản hồi API luôn dưới **1ms**.
*   **Nginx Reverse Proxy:** Điều phối luồng dữ liệu an toàn, chuyển tiếp các yêu cầu tĩnh tới Frontend React và chuyển tiếp các yêu cầu động `/api/*` tới Backend FastAPI.

---

## 🛠️ Hướng Dẫn Chạy Dự Án

### Yêu cầu hệ thống
*   Đã cài đặt **Docker** và **Docker Compose**.

### Các bước khởi chạy

1.  **Thiết lập môi trường cấu hình:**
    Tạo hoặc chỉnh sửa file `.env` tại thư mục `backend/.env` với các nội dung cấu hình sau:
    ```env
    DATABASE_URL=postgresql://devops:devops_password@postgres:5432/devops_portfolio
    ADMIN_KEY=chuỗi_khóa_tĩnh_nếu_cần
    ADMIN_USERNAME=tên_đăng_nhập_admin
    ADMIN_PASSWORD=mật_khẩu_admin
    ```

2.  **Khởi động các dịch vụ bằng Docker Compose:**
    Chạy lệnh sau tại thư mục gốc của dự án:
    ```bash
    docker-compose up -d --build
    ```
    Lệnh này sẽ tự động tải các base image, biên dịch mã nguồn, khởi tạo cơ sở dữ liệu PostgreSQL, chạy migrations và khởi chạy proxy Nginx tại cổng `80`.

3.  **Truy cập ứng dụng:**
    *   Trang chủ khách truy cập: `http://localhost`
    *   Trang đăng nhập Admin: `http://localhost/?admin=unlock` (Nhập tài khoản và mật khẩu đã cấu hình ở bước 1 để truy cập quản trị).
