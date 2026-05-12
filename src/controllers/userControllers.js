import bcrypt from "bcrypt";
import db from "../config/db.js";
import { transporter } from "./email.js"; // Đảm bảo đường dẫn đúng đến file email.js
import { OAuth2Client } from "google-auth-library"; 

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// 1. Lấy danh sách tất cả user
export const getAllUsers = async (req, res) => {
  try {
    // Sửa thành bảng 'users'
    const [users] = await db.query(
      "SELECT id, username, email, avatar, role, full_name, phone, address FROM users",
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
// Xác thực user
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
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Thiếu email hoặc password" });
    }

    // Tìm user bằng email trong bảng 'users'
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = users[0];

    if (!user) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không chính xác" });
    }

    // So sánh password với cột 'password_hash' từ DB
    const passwordCorrect = await bcrypt.compare(password, user.password_hash);
    if (!passwordCorrect) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không chính xác" });
    }
    if (user.is_active === 0) {
      return res.status(403).json({
        message: "Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để xác thực.",
      });
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
    const avatar = req.file?.path || req.file?.secure_url || null;

    // 1. Kiểm tra user tồn tại (Sửa .length)
    const [resultUserExists] = await db.query("SELECT id FROM users WHERE id = ?", [
      userid,
    ]);

    if (resultUserExists.length === 0) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // 2. Xây dựng câu lệnh Update động
    let fields = [];
    let params = [];

    const updateData = { username, email, full_name, phone, address, avatar };

    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined && value !== null) {
        // Chỉ cập nhật nếu có dữ liệu
        fields.push(`${key} = ?`);
        params.push(value);
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "Không có dữ liệu nào để cập nhật" });
    }

    // 3. Thực thi
    params.push(userid);
    const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;

    const [result] = await db.query(sql, params);

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

// 7. Đổi mật khẩu 
export const changPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const { userid } = req.params;

    // 1. Kiểm tra đầu vào
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ mật khẩu cũ và mới" });
    }

    // 2. Lấy mật khẩu hiện tại (đã mã hóa) từ Database
    const [users] = await db.query("SELECT password_hash FROM users WHERE id = ?", [userid]);
    const user = users[0];

    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    } 

    // 3. Kiểm tra mật khẩu mới không được trùng mật khẩu cũ (tùy chọn nhưng nên có)
    if (oldPassword === newPassword) {
      return res.status(400).json({ message: "Mật khẩu mới không được trùng với mật khẩu cũ" });
    }

    // 4. Kiểm tra mật khẩu cũ có khớp không
    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Mật khẩu cũ không chính xác" });
    }

    

    // 5. Mã hóa mật khẩu mới và cập nhật Database
    const salt = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await db.query("UPDATE users SET password_hash = ? WHERE id = ?", [newPasswordHash, userid]);

    return res.status(200).json({ message: "Đổi mật khẩu thành công" });

  } catch (error) {
    console.error("Lỗi khi gọi changPassword:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
}; 

// 8. Đăng nhập bằng google
export const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body; // Token này do FE nhận từ Google rồi gửi cho bạn

    // Xác thực token với Google
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID, 
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    // Kiểm tra và lưu vào Database của bạn
    let [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    let user = users[0];

    if (!user) {
      // Nếu chưa có user thì INSERT mới vào DB
      const [result] = await db.query(
        "INSERT INTO users (username, email, full_name, avatar, role, is_active) VALUES (?, ?, ?, ?, 'customer', 1)",
        [email.split('@')[0], email, name, picture]
      );
      // ... lấy user vừa tạo ...
    }

    // Trả về thông tin cho Frontend
    res.status(200).json({
      success: true,
      message: "Xác thực Google thành công",
      user: { id: user.id, username: user.username, avatar: user.avatar }
    });

  } catch (error) {
    console.error("Lỗi xác thực:", error);
    res.status(401).json({ message: "Xác thực không hợp lệ" });
  }
};