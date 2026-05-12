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
} from "../controllers/userControllers.js";
import uploadImage from "../middleware/upload.js";

const router = express.Router();
router.get("/", getAllUsers);
router.get("/verify/:userid", verifyUser);
router.post("/register", register);
router.post("/login", logIn);
router.put("/:userid", uploadImage.single("avatar"), updateUser);
router.delete("/:id", deleteUser);

export default router;
