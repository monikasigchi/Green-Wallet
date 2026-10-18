import { Router } from "express";
import { register, login, logout, me } from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
const r = Router();
r.post("/register", asyncHandler(register)); r.post("/login", asyncHandler(login)); r.post("/logout", asyncHandler(logout)); r.get("/me", authenticate, asyncHandler(me));
export default r;
