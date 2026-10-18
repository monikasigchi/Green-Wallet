import { Router } from "express";
import { authenticate, allowRoles } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { wallet } from "../controllers/walletController.js";
const r = Router(); r.get("/", authenticate, allowRoles("household"), asyncHandler(wallet)); export default r;
