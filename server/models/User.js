import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ["household", "collector", "organisation"], required: true },
  phone: { type: String, required: true, trim: true },
  status: { type: String, enum: ["active", "suspended"], default: "active" },
  householdProfile: { address: { type: String, default: "" } },
  collectorProfile: { serviceArea: { type: String, default: "" } },
  organisationProfile: { organisationName: { type: String, default: "" }, description: { type: String, default: "" }, contactDetails: { type: String, default: "" } }
}, { timestamps: true });
export default mongoose.model("User", userSchema);
