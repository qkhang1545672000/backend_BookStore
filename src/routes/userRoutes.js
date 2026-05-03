import express from "express";
import dotenv from "dotenv";
dotenv.config();

import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  authEmail,
  sendEmail,
  verifyEmail,
} from "../controllers/userControllers.js";

const router = express.Router();
router.get("/", getAllUsers);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.get("/auth/:Email", authEmail);
router.post("/register", sendEmail);
router.get("/verify/:token", verifyEmail);
export default router;
