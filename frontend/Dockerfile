# Stage 1: Build React App (Vite)
FROM node:18-alpine AS build
WORKDIR /app

# Khai báo cache layer cho package.json
COPY package*.json ./
RUN npm ci

# Copy toàn bộ code và build
COPY . .
RUN npm run build

# Stage 2: Phân phối bằng web server Nginx siêu nhẹ
FROM nginx:alpine
# Xóa cấu hình trang chủ mặc định của Nginx
RUN rm -rf /usr/share/nginx/html/*
# Copy thư mục build từ Stage 1 sang nội dung public Nginx
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
