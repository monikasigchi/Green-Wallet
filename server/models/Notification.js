import mongoose from "mongoose";
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedType: String,
  relatedId: mongoose.Schema.Types.ObjectId,
  readAt: { type: Date, default: null }
}, { timestamps: true });
export default mongoose.model("Notification", schema);
