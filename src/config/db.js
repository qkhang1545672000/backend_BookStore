import mysql from "mysql2";
import "dotenv/config";

// Sử dụng trực tiếp chuỗi kết nối từ biến môi trường
const pool = mysql.createPool({
  uri: process.env.DATABASE_URL, // Chỉ cần 1 biến này
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false, 
  },
});

const db = pool.promise();
export default db;