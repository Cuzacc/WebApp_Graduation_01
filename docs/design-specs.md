# Design Specifications: DevOps Portfolio

## 🌟 Theme & Vibe
**Style:** Tech / Futuristic (Vercel/Linear inspired)
**Keywords:** Dark mode, Glassmorphism, Neon glows, Sleek, Professional.

## 🎨 Color Palette
| Chỉ định | Mã màu (Hex) | Tailwind Class | Ứng dụng |
|------|-----|-------|-------|
| Nền chính (Deep Space) | `#020617` | `bg-slate-950` | Nền toàn bộ website |
| Nền Card (Frosted Glass) | `rgba(30, 41, 59, 0.4)` | `bg-slate-800/40` | Khối Dashboard, Matrix |
| Primary Accent (Xanh Neon) | `#3b82f6` | `text-blue-500` | Nút bấm, Tiêu đề chính |
| Secondary Glow (Tím Neon) | `#8b5cf6` | `text-violet-500` | Gradient highlight |
| Status: Healthy (Sống) | `#10b981` | `text-emerald-500` | Đèn Health Check |
| Status: Error (Chết) | `#ef4444` | `text-red-500` | Báo lỗi |
| Text Chính | `#f8fafc` | `text-slate-50` | Nội dung đọc |
| Text Phụ (Dimmed) | `#94a3b8` | `text-slate-400` | Chú thích, hash code |

## 📝 Typography
| Element | Font Family | Tailwind Class | Phân loại |
|---------|------|------|-------------|
| Tiêu đề lớn (Headers) | **"Inter" / "Outfit"** | `font-sans font-bold` | Gây ấn tượng mạnh |
| Nội dung (Body Text) | **"Inter"** | `font-sans font-normal` | Đọc thông tin |
| Đèn tín hiệu số (Metrics) | **"Fira Code" / "Roboto Mono"** | `font-mono tracking-tight` | Dùng cho Counter, Git Hash |

## 📐 Spacing & Border (Khung xương)
- Giãn cách (Gap): Rộng rãi, thoáng.
- Khung viền (Border): Viền kim loại mờ `border border-slate-700/50`
- Bo góc (Border Radius): `rounded-xl` (Bo tròn hiện đại).

## ✨ Hiệu ứng "Xịn Xò" (Micro-Animations)
1. **Glassmorphism Backdrop:** Khung kính mờ nhìn xuyên thấu `backdrop-blur-md`.
2. **Neon Glow Border:** Rê chuột vào (hover) các thẻ `Card`, viền sẽ hắt sáng xanh/tím lên `hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]`.
3. **Breathing Health Dot:** Đấu hiệu tim đập của Server (Một cái chấm xanh lá cây nhấp nháy liên tục vòng ngoài bằng `animate-pulse`).
4. **Gradient Text Streaming:** Chữ tiêu đề "DevOps Portfolio" chuyển sắc chầm chậm từ Trắng -> Xanh Neon -> Tím.
5. **Số Counter chạy (Number Ticker):** Khi Hit Counter tăng từ 0 -> Tổng View, số sẽ nhảy tạch tạch nhanh dần.

## 📱 Breakpoints (Responsive)
- Mobile: Thẻ nằm dọc (Stack).
- Desktop: Bố cục lưới (CSS Grid bọc Live Dashboard và Timeline nằm song song).
