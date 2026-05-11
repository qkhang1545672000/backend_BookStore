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

const router = express.Router();
router.get("/", getAllUsers); 
router.get("/verify/:id", verifyUser);
router.post("/register", register);
router.post("/login", logIn);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser); 

export default router;
