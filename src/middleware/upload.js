import path from "path";

// Cấu hình nơi lưu & tên file
import fs from "fs"; // Thêm dòng này
import multer from "multer";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "src/uploads/books";

    // Kiểm tra xem thư mục có tồn tại không
    if (!fs.existsSync(dir)) {
      // Nếu không, tạo thư mục (recursive: true giúp tạo cả các thư mục cha nếu chưa có)
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

// Chỉ cho phép ảnh
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ được upload file ảnh"), false);
  }
};

const uploadBookImage = multer({
  storage,
  fileFilter,
});

export default uploadBookImage;
