import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { updateProfile } from "../controllers/userController.js";
const r = Router(); r.patch("/profile", authenticate, asyncHandler(updateProfile)); export default r;
