import multer from "multer";
import path from "node:path";
import fs from "node:fs";
const dir = path.resolve(process.env.UPLOAD_DIR || "uploads");
fs.mkdirSync(dir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname).toLowerCase()}`)
});
const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
export const uploadImages = multer({
  storage, limits: { fileSize: (Number(process.env.MAX_UPLOAD_MB) || 5) * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => cb(null, allowed.has(file.mimetype))
}).array("images", 5);
