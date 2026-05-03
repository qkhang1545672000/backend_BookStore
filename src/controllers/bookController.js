import Book from "../models/Book.js";
// Hàm controller: lấy danh sách tất cả task theo filter (today, week, month, all)
export const getBooks = async (req, res) => {
  try {
    const user = await Book.find(); // SELECT *
    res.status(201).json(user);
  } catch (error) {
    console.error("lỗi khi gọi getAllUsers", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
