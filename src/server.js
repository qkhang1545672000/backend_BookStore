// Import các thư viện cần thiết
import express from "express"; // Framework Express để tạo server HTTP
import roomRoutes from "./routes/roomRoutes.js"; // File định nghĩa các routes liên quan đến "tasks"
import tenantRoutes from "./routes/tenantRoutes.js";

// File định nghĩa các routes liên quan đến "users"

import { connectDB } from "./config/db.js"; // Hàm để kết nối Database (ví dụ: MongoDB)

import dotenv from "dotenv"; // Đọc file .env để lấy các biến môi trường

import cors from "cors"; // Cho phép frontend từ domain khác gọi API (Cross-Origin Resource Sharing)

import path from "path"; // Xử lý đường dẫn file/thư mục

// Đọc biến môi trường từ file .env vào process.env
dotenv.config();

// Lấy PORT từ file .env, nếu không có thì dùng mặc định là 5001
const PORT = process.env.PORT || 5001;

// __dirname: lấy đường dẫn tuyệt đối đến thư mục hiện tại (khi chạy bằng ES Module phải dùng path.resolve)
const __dirname = path.resolve();

// Khởi tạo ứng dụng Express
const app = express();

// Middleware: cho phép Express tự động parse JSON trong request body
app.use(express.json());

// Nếu đang chạy ở môi trường development thì cho phép frontend (localhost:5173) gọi API
if (process.env.NODE_ENV === "development") {
  app.use(cors({ origin: "http://localhost:5173" }));
}

// Gắn routes cho endpoint "/api/tasks"
// Ví dụ: gọi GET http://localhost:5001/api/tasks -> sẽ chạy vào taskRoutes
app.use("/api/rooms", roomRoutes);
app.use("/api/tenants", tenantRoutes);

// Nếu đang chạy ở môi trường production thì phục vụ luôn frontend build sẵn (React/Vite/...)
// Nghĩa là backend + frontend sẽ chạy cùng một server
if (process.env.NODE_ENV === "production") {
  // Cho phép Express phục vụ các file tĩnh trong thư mục dist (frontend đã build)
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  // Bắt mọi request khác (không khớp API) trả về index.html (cho React Router hoạt động)
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}

// Kết nối database trước, nếu thành công thì mới chạy server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
  });
});
