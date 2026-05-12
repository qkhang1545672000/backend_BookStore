import express from "express";
import dotenv from "dotenv";
dotenv.config();

import {
  getAllUsers,
  verifyUser,
  logIn,
  register,
  updateUser,
  deleteUser,
  changPassword,
  googleLogin,
} from "../controllers/userControllers.js";
import uploadImage from "../middleware/upload.js";

const router = express.Router();
router.get("/", getAllUsers);
router.get("/verify/:userid", verifyUser); 
router.put("/changepassword/:userid",changPassword)
router.post("/register", register);
router.post("/login", logIn); 
router.post("/login/google", googleLogin);
// Route cập nhật User
router.put(
  "/update/:userid",
  (req, res, next) => {
    uploadImage.single("avatar")(req, res, (err) => {
      if (err) {
        // Bắt lỗi và trả về JSON thay vì HTML
        return res.status(400).json({
          message: "chỉ tải ảnh dạng jpg,png, jpeg." || err.message,
        });
      }
      // Nếu ổn, đi tiếp sang controller updateUser
      next();
    });
  },
  updateUser,
);
router.delete("/:id", deleteUser);

export default router;
