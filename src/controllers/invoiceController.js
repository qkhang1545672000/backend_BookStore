import db from "../config/db.js";  
export const createInvoice = async (req, res) => {
  const { user_id, total_amount, note, items } = req.body; 

  // 1. Kiểm tra thiếu trường
  if (!user_id || !total_amount || !items) {
    return res.status(400).json({ message: "Các trường user_id, total_amount, items không được trống" }); 
  }  

  // 2. Kiểm tra items có phải là mảng không
  if (!Array.isArray(items)) {
    return res.status(400).json({ message: "Danh sách sản phẩm (items) không hợp lệ" });
  }  

  // 3. Kiểm tra items có rỗng không 
  if (items.length === 0) {
    return res.status(400).json({ message: "Giỏ hàng rỗng, không thể tạo hóa đơn." });
  } 

  // 4. Kiểm tra cấu trúc từng phần tử
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.book_id || !item.quantity || item.quantity <= 0 || item.unit_price === undefined || item.unit_price < 0) {
      return res.status(400).json({
        success: false,
        message: `Sản phẩm tại vị trí ${i + 1} không đúng cấu trúc (thiếu ID, số lượng hoặc đơn giá).`
      });
    }
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction(); 

    //Bước 1 : kiểm tra người dùng có tồn tại không
        const [resultUserExists] = await connection.query("SELECT id FROM users WHERE id = ?", [
      user_id,
    ]); 
    if (resultUserExists.length === 0) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }
    // Bước 2: Chèn vào bảng invoices  
    const [invoiceResult] = await connection.query(
      "INSERT INTO invoices (user_id, total_amount, status, note) VALUES (?, ?, 'pending', ?)",
      [user_id, total_amount, note]
    );

    const invoiceId = invoiceResult.insertId;

    // Bước 2: Chèn hàng loạt vào bảng invoice_items
    const itemData = items.map(item => [
      invoiceId,
      item.book_id,
      item.quantity,
      item.unit_price
    ]);

    await connection.query(
      "INSERT INTO invoice_items (invoice_id, book_id, quantity, unit_price) VALUES ?",
      [itemData]
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Tạo hóa đơn thành công",
      invoice_id: invoiceId
    });

  } catch (error) {
    await connection.rollback();
    console.error("Lỗi tạo hóa đơn:", error);
    return res.status(500).json({ success: false, message: "Lỗi hệ thống khi tạo hóa đơn" });
  } finally {
    connection.release();
  }
};
