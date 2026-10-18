import jwt from "jsonwebtoken";
import User from "../models/User.js";
export async function authenticate(req, res, next) {
  try {
    const token = req.cookies?.gw_token || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null);
    if (!token) return res.status(401).json({ message: "Please sign in to continue." });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user || user.status !== "active") return res.status(401).json({ message: "Account is unavailable." });
    req.user = user;
    next();
  } catch { return res.status(401).json({ message: "Your session is invalid or expired. Please sign in again." }); }
}
export const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ message: "You do not have permission to perform this action." });
  next();
};
