import mongoose from "mongoose";
const schema = new mongoose.Schema({
  household: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  organisation: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  orderCode: { type: String, required: true, unique: true },
  idempotencyKey: { type: String, unique: true, sparse: true },
  productSnapshot: { name: String, image: String, category: String },
  quantity: { type: Number, required: true, min: 1 },
  pointsPerItem: { type: Number, required: true },
  totalPoints: { type: Number, required: true },
  deliverySnapshot: { address: String, phone: String, householdName: String },
  status: { type: String, enum: ["placed", "processing", "dispatched", "received", "cancelled"], default: "placed", index: true },
  trackingInfo: { type: String, default: "" },
  dispatchedAt: Date, receivedAt: Date
}, { timestamps: true });
schema.index({ household: 1, status: 1 });
schema.index({ organisation: 1, status: 1 });
export default mongoose.model("Order", schema);
