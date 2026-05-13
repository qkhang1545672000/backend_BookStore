import db from "./config/db.js";



export const isExistUser = async (userid) => {
  try {
    // 1. Chỉ lấy số 1 để kiểm tra sự tồn tại cho nhẹ
    const [resultUserExists] = await db.query(
      "SELECT 1 FROM users WHERE id = ? LIMIT 1", 
      [userid]
    );

    // 2. Trả về true nếu mảng có phần tử, ngược lại false
    return resultUserExists.length > 0;

  } catch (error) {
    console.error("Lỗi khi kiểm tra user tồn tại:", error);
    // 3. Nếu lỗi DB, mặc định trả về false để bảo vệ hệ thống
    return false; 
  }
};