import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { listNotifications, markRead } from "../controllers/notificationController.js";
const r = Router(); r.use(authenticate); r.get("/", asyncHandler(listNotifications)); r.patch("/:id/read", asyncHandler(markRead)); export default r;
