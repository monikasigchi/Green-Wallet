import Product from "../models/Product.js";
const fields = body => ({
  name: String(body.name || "").trim(), description: String(body.description || "").trim(),
  category: String(body.category || "").trim(), pointsRequired: Number(body.pointsRequired),
  stock: Number(body.stock), cashPrice: body.cashPrice === "" || body.cashPrice == null ? null : Number(body.cashPrice),
  active: body.active !== false
});
function validate(p) {
  if (p.name.length < 2 || p.name.length > 140 || p.description.length < 5 || p.description.length > 2000 || !p.category || p.category.length > 80) return "Enter a valid name, description and category.";
  if (!Number.isInteger(p.pointsRequired) || p.pointsRequired < 1 || !Number.isInteger(p.stock) || p.stock < 0 || p.stock > 100000) return "Points must be a positive integer and stock a non-negative integer.";
  if (p.cashPrice !== null && (!Number.isFinite(p.cashPrice) || p.cashPrice < 0)) return "Cash price must be non-negative.";
  return null;
}
export async function listProducts(req, res) {
  const filter = { active: true, stock: { $gt: 0 } };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.search) filter.$or = [{ name: { $regex: String(req.query.search).slice(0,80), $options: "i" } }, { description: { $regex: String(req.query.search).slice(0,80), $options: "i" } }];
  const products = await Product.find(filter).populate("organisation", "name organisationProfile.organisationName").sort({ createdAt: -1 }).limit(100);
  res.json({ products });
}
export async function myProducts(req, res) {
  res.json({ products: await Product.find({ organisation: req.user._id }).sort({ createdAt: -1 }) });
}
export async function createProduct(req, res) {
  const p = fields(req.body); const err = validate(p); if (err) return res.status(400).json({ message: err });
  p.images = (req.files || []).map(f => `/uploads/${f.filename}`);
  const product = await Product.create({ ...p, organisation: req.user._id });
  res.status(201).json({ product });
}
export async function updateProduct(req, res) {
  const p = fields(req.body); const err = validate(p); if (err) return res.status(400).json({ message: err });
  const update = { ...p };
  if (req.files?.length) update.images = req.files.map(f => `/uploads/${f.filename}`);
  const product = await Product.findOneAndUpdate({ _id: req.params.id, organisation: req.user._id }, { $set: update }, { new: true, runValidators: true });
  if (!product) return res.status(404).json({ message: "Product not found in your organisation." });
  res.json({ product });
}
export async function deleteProduct(req, res) {
  const product = await Product.findOneAndUpdate({ _id: req.params.id, organisation: req.user._id }, { $set: { active: false } }, { new: true });
  if (!product) return res.status(404).json({ message: "Product not found in your organisation." });
  res.json({ message: "Product deactivated." });
}
