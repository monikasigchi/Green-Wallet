import mongoose from "mongoose";
const schema = new mongoose.Schema({
  household: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, enum: ["credit", "debit"], required: true },
  points: { type: Number, required: true, min: 1 },
  description: { type: String, required: true },
  pickup: { type: mongoose.Schema.Types.ObjectId, ref: "Pickup", default: null },
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
  idempotencyKey: { type: String, required: true, unique: true }
}, { timestamps: true });
export default mongoose.model("WalletTransaction", schema);
