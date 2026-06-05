# Security Audit Report - 2026-06-04

## Summary
- 🔴 Critical Issues: 0
- 🟡 Warnings: 1
- 🟢 Suggestions: 0

---

## 🔴 Critical Issues (Phải sửa ngay)
*Chúc mừng! Không phát hiện lỗ hổng bảo mật nghiêm trọng nào.*

---

## 🟡 Warnings (Nên sửa)

### 1. Thiếu cơ chế chống thử mật khẩu liên tục (Lack of Rate Limiting / Brute-force Protection)
- **File:** [main.py](file:///f:/DevOps/web/graduation_01/backend/main.py) (Endpoint `/api/admin/login` và `/api/wishes`)
- **Nguy hiểm:** 
  Hệ thống hiện tại chưa giới hạn số lần yêu cầu đăng nhập sai trong một khoảng thời gian. Hacker có thể sử dụng các bộ từ điển mật khẩu (wordlist) và gửi hàng nghìn yêu cầu đăng nhập mỗi phút để dò tìm mật khẩu Admin của anh. Ngoài ra, việc thiếu giới hạn này ở endpoint gửi thiệp `/api/wishes` cho phép spam gửi liên tục để phá hoại hệ thống.
- **Cách sửa:**
  Tích hợp cơ chế Rate Limiting trực tiếp trên Nginx proxy bằng cách cấu hình `limit_req` hoặc sử dụng thư viện `slowapi` ở Backend FastAPI.
  *Ví dụ cấu hình giới hạn đăng nhập tối đa 5 lần/phút cho mỗi địa chỉ IP trên Nginx:*
  ```nginx
  limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;
  
  location /api/admin/login {
      limit_req zone=login_limit burst=3 nodelay;
      proxy_pass http://backend:8000;
  }
  ```

---

## 🟢 Suggestions (Tùy chọn)
*Tất cả các đề xuất tối ưu bảo mật (sử dụng Token ngẫu nhiên an toàn và tự động dọn dẹp session cũ) đều đã được thực hiện.*
