import express from "express";
import dotenv from "dotenv";
dotenv.config();

import { createInvoice } from "../controllers/invoiceController.js";


const router = express.Router();

router.post("/add", createInvoice);





export default router;
