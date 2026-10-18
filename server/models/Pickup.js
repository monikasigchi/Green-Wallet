import mongoose from "mongoose";
const categories = ["paper", "newspapers", "cardboard", "metal", "rigidPlastic", "otherDry"];
const pickupSchema = new mongoose.Schema({
  household: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  assignedCollector: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  address: { type: String, required: true, maxlength: 500 },
  locality: { type: String, default: "" },
  instructions: { type: String, default: "", maxlength: 500 },
  scheduledAt: { type: Date, required: true, index: true },
  categories: [{ type: String, enum: categories }],
  estimatedKg: { type: Number, min: 0, max: 10000, default: null },
  images: [{ type: String }],
  notes: { type: String, default: "", maxlength: 1000 },
  status: { type: String, enum: ["scheduled", "accepted", "completed", "cancelled"], default: "scheduled", index: true },
  qrTokenHash: { type: String, required: true, unique: true, select: false },
  rejectionHistory: [{ collector: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, at: Date }],
  verifiedWeights: { type: Map, of: Number, default: {} },
  rewardPoints: { type: Number, default: 0 },
  rewardBreakdown: { type: mongoose.Schema.Types.Mixed, default: [] },
  acceptedAt: Date, completedAt: Date, cancelledAt: Date,
  verification: { collector: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, at: Date }
}, { timestamps: true });
pickupSchema.index({ status: 1, scheduledAt: 1 });
export default mongoose.model("Pickup", pickupSchema);
