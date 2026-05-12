import bcrypt from "bcrypt";
import db from "../config/db.js";
import { transporter } from "./email.js"; // Đảm bảo đường dẫn đúng đến file email.js

// 1. Lấy danh sách tất cả user
export const getAllUsers = async (req, res) => {
  try {
    // Sửa thành bảng 'users'
    const [users] = await db.query(
      "SELECT id, username, email, role, full_name, phone,address FROM users",
    );
    res.status(200).json(users);
  } catch (error) {
    console.error("lỗi khi gọi getAllUsers", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// 2. Đăng ký (Register)

export const register = async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;
    if (!username || !email || !password || !full_name) {
      return res.status(400).json({ message: "Thiếu thông tin đăng ký" });
    }

    const [existingUsers] = await db.query(
      "SELECT * FROM users WHERE username = ? OR email = ?",
      [username, email],
    );
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: "Username hoặc Email đã tồn tại" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Khi đăng ký, ta để is_active = 0 (đang chờ xác thực)
    const [result] = await db.query(
      "INSERT INTO users (username, email,full_name, password_hash, is_active) VALUES (?, ?, ?, ?, ?)",
      [username, email, full_name, hashedPassword, 0],
    );

    // Cấu hình nội dung Email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Xác nhận đăng ký tài khoản Bookstore",
      html: `
        <h1>Chào mừng ${username}!</h1>
        <p>Cảm ơn bạn đã đăng ký tài khoản tại Bookstore.</p>
        <p>Vui lòng nhấn vào đây để kích hoạt tài khoản của bạn:</p>
       <p><a href="https://bookking000.vercel.app/api/users/verify/${result.insertId}">để xác thực.</a> </p>
      `,
    };

    // Gửi email
    await transporter.sendMail(mailOptions);

    res.status(201).json({
      message: "Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản.",
      data: { id: result.insertId, username, email },
    });
  } catch (error) {
    console.error("Lỗi:", error);
    res.status(500).json({ message: "Lỗi hệ thống khi đăng ký" });
  }
};
export const verifyUser = async (req, res) => {
  try {
    const { userid } = req.params;

    const [result] = await db.query(
      "UPDATE users SET is_active = 1 WHERE id = ? AND is_active = 0",
      [userid],
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Liên kết không hợp lệ, đã hết hạn hoặc tài khoản đã được kích hoạt trước đó.",
      });
    }

    // Trả về JSON để FE thích điều hướng đi đâu thì đi (ví dụ về trang login)
    return res.status(200).json({
      success: true,
      message: "Xác thực thành công! Bạn hiện đã có thể đăng nhập.",
    });
  } catch (error) {
    console.error("Lỗi xác thực:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống trong quá trình xác thực.",
    });
  }
};

// 3. Đăng nhập (Login)
export const logIn = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Thiếu username hoặc password" });
    }

    // Tìm user bằng username trong bảng 'users'
    const [users] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
    const user = users[0];

    if (!user) {
      return res.status(401).json({ message: "Username hoặc password không chính xác" });
    }

    // So sánh password với cột 'password_hash' từ DB
    const passwordCorrect = await bcrypt.compare(password, user.password_hash);
    if (!passwordCorrect) {
      return res.status(401).json({ message: "Username hoặc password không chính xác" });
    }

    return res.status(200).json({
      message: "Đăng nhập thành công",
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Lỗi khi gọi logIn", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// 4. Cập nhật User
export const updateUser = async (req, res) => {
  try {
    const { username, email, full_name, phone, address } = req.body;
    const { userid } = req.params;

    const sqlUserExists = `SELECT * FROM users WHERE id = ?`;

    const [resultUserExists] = await db.query(sqlUserExists, userid);

    if (resultUserExists.affectedRows === 0) {
      return res.status(404).json({ message: "Cập nhật không thành công" });
    }

    let fields = [];
    let params = [];

    if (username) {
      fields.push("username = ?");
      params.push(username);
    }

    if (email) {
      fields.push("email = ?");
      params.push(email);
    }

    if (full_name) {
      fields.push("full_name = ?");
      params.push(full_name);
    }
    if (phone) {
      fields.push("phone = ?");
      params.push(phone);
    }
    if (address) {
      fields.push("address = ?");
      params.push(address);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "Không có dữ liệu nào để cập nhật" });
    }

    params.push(userid);

    const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;

    const [result] = await db.query(sql, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng để cập nhật" });
    }

    res.status(200).json({ message: "Cập nhật thành công" });
  } catch (error) {
    console.error("Lỗi khi gọi updateUser:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// 6. Xóa User
export const deleteUser = async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM users WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy user" });
    }
    res.status(200).json({ message: "Xóa user thành công" });
  } catch (error) {
    console.error("lỗi khi gọi deleteUser", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
