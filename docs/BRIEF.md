# 💡 BRIEF: DevOps Portfolio "Living System"

**Ngày tạo:** Hôm nay
**Brainstorm cùng:** Quang

---

## 1. VẤN ĐỀ CẦN GIẢI QUYẾT
- Ứng viên Fresher DevOps cần một dự án thực tế để chứng minh năng lực thực với nhà tuyển dụng, thay vì chỉ liệt kê từ khóa công nghệ trên CV. Khó khăn là nhà tuyển dụng không có cách nào kiểm chứng được các skill đó ngay lúc đọc CV.

## 2. GIẢI PHÁP ĐỀ XUẤT
- Xây dựng một Web App Full-stack (Frontend, Backend, Database) làm Portfolio cá nhân, nhưng được cấu trúc theo chuẩn ứng dụng đa tầng thực tế.
- **Điểm nhấn "Ăn tiền":** Web App sẽ trở thành một "Hệ thống sống" (Living System). Giao diện web trực tiếp hiển thị các thông số hạ tầng (Live Metrics), trạng thái luồng CI/CD, và kiến trúc hệ thống đang chạy. Người xem tương tác với giao diện là hệ thống sẽ tạo logs và được monitor trực tiếp.

## 3. ĐỐI TƯỢNG SỬ DỤNG
- **Primary:** Nhà tuyển dụng (HR, Tech Lead, Senior DevOps) muốn đánh giá năng lực của ứng viên.
- **Secondary:** Bất cứ ai vào xem CV và dự án.

## 4. NGHIÊN CỨU THỊ TRƯỜNG & ĐIỂM KHÁC BIỆT
- **Thị trường:** Thường các ứng viên chỉ gửi github link có chứa mã nguồn CI/CD hoặc đưa file PDF để tuyển dụng tự đánh giá.
- **Khác biệt của mình ("What you see is what I deployed"):** 
  - Portfolio không chỉ là chữ và ảnh tĩnh. 
  - Nó là một Demo sống động: hiển thị luôn version commit đang chạy (Git), CPU/RAM server (Prometheus), số request API (Backend). Nhà tuyển dụng thấy tận mắt hệ thống dưới nền đang sống và chạy qua kỹ năng của ứng viên.

## 5. TÍNH NĂNG

### 🚀 MVP (Bắt buộc có để chạy demo):
- [ ] **Core Portfolio:** Hiển thị profile cá nhân, timeline học tập/làm việc.
- [ ] **Live DevOps Dashboard (Trên Web):** 
      - Hiển thị ID của bản Git commit đang deploy.
      - Component đếm tổng số lượng người truy cập (Hit Counter - API chọc xuống Database để lưu trữ).
      - Check "Health Status": Hiển thị trực tiếp API Backend & Database đang "Sống" hay "Chết".
- [ ] **Hạ tầng (Setup ngầm dưới nền):** 
      - Đóng gói toàn bộ bằng Docker (Frontend, Backend, DB).
      - Chạy thực tế bằng `docker-compose`.
      - Pipeline CI/CD đơn giản tự deploy lên VPS.
      - Nginx Reverse proxy.

### 🎁 Phase 2 (Cân nhắc làm sau):
- [ ] Lấy số liệu thật từ thiết bị giám sát (Prometheus) bắn lên web.
- [ ] Áp dụng Ansible / Terraform để viết script tự động hóa khởi tạo VPS.
- [ ] Redis Caching thay thế/kết hợp với DB đếm số lượng View.
- [ ] Luồng tự động backup Database.

## 6. ƯỚC TÍNH SƠ BỘ
- **Độ phức tạp:** Khá cứng (Trung bình-Khó), không khó ở code app (do tính năng đơn giản), mà cần tính tỉ mỉ ở phần setup flow CI/CD, proxy, và gọi API check health server an toàn lên web.
- **Rủi ro:** Khi hiển thị dữ liệu server ra ngoài (public), cần che giấu các thông tin nhạy cảm.

## 7. BƯỚC TIẾP THEO
→ Chạy `/plan` để lên thiết kế chi tiết (Database schema, Architecture Diagram).
