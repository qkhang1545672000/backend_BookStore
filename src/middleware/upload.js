import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

// Đăng nhập vào Cloudinary bằng Key của bạn
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "avatar", // Thư mục này sẽ tự tạo trên Cloudinary
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const uploadImage = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Kiểm tra định dạng file thực tế
    if (
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpg"
    ) {
      cb(null, true); // Chấp nhận file
    } else {
      cb(
        new Error(
          "Hệ thống chỉ chấp nhận ảnh định dạng JPG, PNG hoặc JPEG thôi bạn nhé!",
        ),
        false,
      ); // Từ chối và ném lỗi
    }
  },
});
export default uploadImage;
