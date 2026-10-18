import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Joi from "joi";
import User from "../models/User.js";
const schema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  email: Joi.string().email().max(254).required(),
  password: Joi.string().min(8).max(128).required(),
  phone: Joi.string().trim().min(7).max(24).required(),
  role: Joi.string().valid("household", "collector", "organisation").required(),
  address: Joi.string().allow("").max(500),
  serviceArea: Joi.string().allow("").max(200),
  organisationName: Joi.string().allow("").max(140),
  description: Joi.string().allow("").max(1000),
  contactDetails: Joi.string().allow("").max(300)
});
function safeUser(user) {
  return { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, householdProfile: user.householdProfile, collectorProfile: user.collectorProfile, organisationProfile: user.organisationProfile };
}
function setCookie(res, user) {
  const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.cookie("gw_token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: process.env.COOKIE_SAME_SITE || "lax", maxAge: 7 * 24 * 60 * 60 * 1000, path: "/" });
}
export async function register(req, res) {
  const { value, error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ message: error.details.map(d => d.message).join(". ") });
  const { name, email, password, phone, role, address, serviceArea, organisationName, description, contactDetails } = value;
  if (role === "household" && !address?.trim()) return res.status(400).json({ message: "Pickup address is required." });
  if (role === "collector" && !serviceArea?.trim()) return res.status(400).json({ message: "Service area is required." });
  if (role === "organisation" && !organisationName?.trim()) return res.status(400).json({ message: "Organisation name is required." });
  if (await User.exists({ email: email.toLowerCase() })) return res.status(409).json({ message: "An account with this email already exists." });
  const user = await User.create({
    name, email: email.toLowerCase(), passwordHash: await bcrypt.hash(password, 12), phone, role,
    householdProfile: { address: address || "" }, collectorProfile: { serviceArea: serviceArea || "" },
    organisationProfile: { organisationName: organisationName || name, description: description || "", contactDetails: contactDetails || phone }
  });
  setCookie(res, user);
  res.status(201).json({ user: safeUser(user) });
}
export async function login(req, res) {
  const email = String(req.body.email || "").toLowerCase().trim();
  const password = String(req.body.password || "");
  if (!email || !password) return res.status(400).json({ message: "Email and password are required." });
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: "Email or password is incorrect." });
  if (user.status !== "active") return res.status(403).json({ message: "This account is suspended." });
  setCookie(res, user);
  res.json({ user: safeUser(user) });
}
export async function logout(req, res) {
  res.clearCookie("gw_token", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: process.env.COOKIE_SAME_SITE || "lax", path: "/" });
  res.json({ message: "Signed out successfully." });
}
export async function me(req, res) { res.json({ user: safeUser(req.user) }); }
