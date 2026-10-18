import mongoose from "mongoose";
const schema = new mongoose.Schema({
  organisation: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 140 },
  description: { type: String, required: true, maxlength: 2000 },
  category: { type: String, required: true, maxlength: 80 },
  images: [{ type: String }],
  pointsRequired: { type: Number, required: true, min: 1 },
  stock: { type: Number, required: true, min: 0, max: 100000 },
  cashPrice: { type: Number, min: 0, default: null },
  active: { type: Boolean, default: true, index: true }
}, { timestamps: true });
schema.index({ active: 1, category: 1, pointsRequired: 1 });
export default mongoose.model("Product", schema);
