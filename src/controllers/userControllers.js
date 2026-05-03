import Task from "../models/Task.js";
import User from "../models/User.js";
import { transporter } from "./Email.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
// Hàm controller: lấy danh sách tất cả task theo filter (today, week, month, all)
export const getAllUsers = async (req, res) => {
  try {
    const user = await User.find(); // SELECT *
    res.status(201).json(user);
  } catch (error) {
    console.error("lỗi khi gọi getAllUsers", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const createUser = async (req, res) => {
  try {
    // CÁCH 1: const newTask = await Task.create({ title: "Học Mongoose" }); Viết gọn

    const { email, password } = req.body;
    const user = new User({ Email: email, Password: password });
    const newUser = await user.save();

    res.status(201).json(newUser);
  } catch (error) {
    console.error("lỗi khi gọi createUser", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Hàm controller để cập nhật 1 user theo id
export const updateUser = async (req, res) => {
  try {
    // Lấy dữ liệu từ body request (client gửi lên)
    const { Email, Password } = req.body;

    // Tìm task theo id (req.params.id) và cập nhật dữ liệu mới
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id, // id lấy từ URL (ví dụ: /tasks/66ec1f3a7a...)
      {
        Email,
        Password,
      },
      { new: true } // new: true => trả về document sau khi cập nhật (mặc định là document cũ)
    );

    // Nếu không tìm thấy task nào với id đó
    if (!updatedUser) {
      return res
        .status(404) // Trả về HTTP 404 Not Found
        .json({ message: "Không tìm thấy nhiệm vụ" });
    } else {
      // Nếu tìm thấy và cập nhật thành công, trả về task mới
      res.status(200).json(updatedUser);
    }
  } catch (error) {
    // Nếu có lỗi (id sai, DB lỗi, ...)
    console.error("lỗi khi gọi updateUser", error);
    res.status(500).json({ message: "Lỗi hệ thống" }); // Trả về HTTP 500 Internal Server Error
  }
};
export const authEmail = async (req, res) => {
  try {
    const user = await User.findOne({ Email: req.params.Email });

    if (user) {
      return res
        .status(200)
        .json({ message: "Email đã tồn tại", user });
    } else {
      return res.status(404).json({ message: "Email chưa tồn tại" });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
};

// router.post("/login", async (req, res) => {
//   const { Email, Password } = req.body;

export const deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy nhiệm vụ" });
    }
    res.status(200).json(deletedUser);
  } catch (error) {
    console.error("lỗi khi gọi deleteUser", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
export const sendEmail = async (req, res) => {
  try {
    const { email, password } = req.body;

    // mã hóa Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // tạo user mới
    const user = await User.create({
      Email: email,
      Password: hashedPassword,
    });

    // tạo token xác thực (hết hạn sau 1 ngày)
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // link xác nhận
    const verifyLink = `http://localhost:5000/api/verify/${token}`;

    // gửi Email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Xác nhận Email",
      html: `<h1>Chào bạn!</h1><p>Nhấn vào link sau để xác nhận Email:</p><a href="${verifyLink}">${verifyLink}</a>`,
    });

    res.json({
      message:
        "Đăng ký thành công, vui lòng kiểm tra Email để xác nhận.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi đăng ký" });
  }
};
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    await User.findByIdAndUpdate(decoded.id, { verified: true });

    res.send("Xác nhận Email thành công! Bạn có thể đăng nhập.");
  } catch (error) {
    console.error(error);
    res.status(400).send("Token không hợp lệ hoặc đã hết hạn.");
  }
};
