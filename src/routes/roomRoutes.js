import express from "express";
import {
  getRoom,
  createRoom,
  deleteRoom,
  UpdateRoom,
} from "../controllers/roomController.js";
const router = express.Router();
router.get("/", getRoom);
router.post("/", createRoom);

router.put("/:id", UpdateRoom);

router.delete("/:id", deleteRoom);
export default router;
