import express from "express";
import dotenv from "dotenv";
dotenv.config();

import { createInvoice, getInvoiceForCustom } from "../controllers/invoiceController.js";


const router = express.Router();

router.post("/add", createInvoice);
router.get("/:userid",getInvoiceForCustom);




export default router;
