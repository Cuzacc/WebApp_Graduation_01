# 🎨 DESIGN: DevOps Portfolio "Hệ Thống Sống"

Ngày tạo: Hôm nay
Dựa trên: Kế hoạch DevOps Portfolio

---

## 1. Cách Lưu Thông Tin (Database PostgreSQL)

📦 SƠ ĐỒ LƯU TRỮ:

```text
┌─────────────────────────────────────────────────────────────┐
│  👀 VISITORS (Lượt truy cập)                                 │
│  Mục đích: Khách (hoặc nhà tuyển dụng) vào xem thông tin    │
│  ├── id (Mã số tự tăng)                                     │
│  ├── ip_hashed (IP người dùng - ẩn danh)                    │
│  ├── user_agent (Trình duyệt)                               │
│  └── created_at (Thời gian vào xem)                         │
└───────────────────────────┬─────────────────────────────────┘
                            │ (1 lần load web = ghi 1 dòng)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  ❤️ SYSTEM_METRICS (Phòng khám sức khoẻ)                  │
│  Mục đích: Bot Worker ghi nhận trạng thái Server             │
│  ├── id                                                     │
│  ├── service_name (Ví dụ: "Backend FastAPI", "DB postgres") │
│  ├── status (UP/DOWN)                                       │
│  ├── latency_ms (Tốc độ phản hồi ngầm định, ms)            │
│  └── checked_at                                             │
└─────────────────────────────────────────────────────────────┘
```

## 2. Danh Sách Màn Hình (Frontend React)

| # | Tên Component | Mục đích |
|---|---|---|
| 1 | `HeroBanner` | Giới thiệu (Tên, Ảnh tĩnh, Vị trí ứng tuyển) |
| 2 | `SkillMatrix` | Liệt kê skill: Docker, CI/CD, Python, AWS |
| 3 | `LiveDashboard` | Hiển thị bảng điều khiển "Flex Skill" - Tổng View, Health của API & DB, và Commit Git. |
| 4 | `Timeline` | Lịch sử học tập / dự án |

## 3. Luồng Hoạt Động (User Journey)

🚶 HÀNH TRÌNH 1: Tương tác Mặt tiền
1️⃣ User vào trang web.
2️⃣ React gửi 1 tín hiệu API `POST /api/visitors` báo xuống Backend FastAPI.
3️⃣ FastAPI ghi dữ liệu xuống cấu trúc Postgres và phản hồi lại con số `Tổng Views`.
4️⃣ React cập nhật số Hit vào cái ô Dashboard ngay trên màn hình.

🚶 HÀNH TRÌNH 2: Tương tác Kín ở Hậu trường
1️⃣ Không ai thấy, nhưng đoạn code `Worker Python` chạy rục rịch dưới nền.
2️⃣ Worker chạy vòng lặp tuần hoàn, tự "ping" vào Backend xem còn đang thở hay không.
3️⃣ Dữ liệu nhịp tim được cất vào kho `SYSTEM_METRICS`.
4️⃣ Frontend sẽ lấy dữ liệu này thắp lên con "Đèn Xanh" xịn xò trên góc bảng.

## 4. Checklist Kiểm Tra & Test (Acceptance Criteria)

### TC-01: Hệ thống đếm Hit Counter (Phase 2 & 3)
- [ ] Khi Frontend load xong, bắt buộc phải có log báo API `/api/visitors` gọi thành công.
- [ ] Dữ liệu dưới Database Postgres phải tăng thêm 1 row.
- [ ] Số hiển thị ở Dashboard phải đồng bộ y chang.

### TC-02: Báo Đèn Sức khoẻ (Phase 2 & 4)
- [ ] Khi Worker ngừng hoạt động hoặc API chết, Web phải kịp thời cập nhật bóng đèn sang màu Đỏ.
- [ ] Nếu trơn tru, hiển thị Đèn xanh với số ping ms đo được.

---
*Tạo bởi AWF 2.1 - Design Phase*
