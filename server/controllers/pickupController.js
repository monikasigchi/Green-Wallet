import crypto from "node:crypto";
import QRCode from "qrcode";
import Pickup from "../models/Pickup.js";
import WalletTransaction from "../models/WalletTransaction.js";
import User from "../models/User.js";
import { calculateReward } from "../config/rewards.js";
import { notify } from "../utils/notify.js";
const categories = ["paper", "newspapers", "cardboard", "metal", "rigidPlastic", "otherDry"];
const cancelAllowed = pickup => pickup.scheduledAt.getTime() - Date.now() > 30 * 60 * 1000;
const publicPickup = p => ({ ...p.toObject(), qrTokenHash: undefined });
export async function createPickup(req, res) {
  const { address, instructions = "", scheduledAt, estimatedKg, notes = "", locality = "" } = req.body;
  let selected = req.body.categories;
  if (typeof selected === "string") { try { selected = JSON.parse(selected); } catch { selected = []; } }
  const date = new Date(scheduledAt);
  if (!address?.trim() || !scheduledAt || Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) return res.status(400).json({ message: "Enter an address and a future pickup date/time." });
  if (!Array.isArray(selected) || !selected.length || selected.some(c => !categories.includes(c))) return res.status(400).json({ message: "Choose at least one valid waste category." });
  if (estimatedKg !== undefined && estimatedKg !== "" && (!Number.isFinite(Number(estimatedKg)) || Number(estimatedKg) < 0 || Number(estimatedKg) > 10000)) return res.status(400).json({ message: "Estimated weight must be between 0 and 10,000 kg." });
  const rawToken = crypto.randomBytes(32).toString("hex");
  const images = (req.files || []).map(f => `/uploads/${f.filename}`);
  const pickup = await Pickup.create({
    household: req.user._id, address: address.trim(), locality, instructions, scheduledAt: date, categories: selected,
    estimatedKg: estimatedKg === "" || estimatedKg === undefined ? null : Number(estimatedKg), notes, images,
    qrTokenHash: crypto.createHash("sha256").update(rawToken).digest("hex")
  });
  await notify(req.user._id, "pickup", "Pickup scheduled", `Pickup ${pickup._id.toString().slice(-8).toUpperCase()} has been scheduled.`, "pickup", pickup._id);
  const qrCode = await QRCode.toDataURL(`GW:${pickup._id.toString()}:${rawToken}`);
  res.status(201).json({ pickup: publicPickup(pickup), qrCode });
}
export async function listHouseholdPickups(req, res) {
  const pickups = await Pickup.find({ household: req.user._id }).sort({ scheduledAt: -1 }).lean();
  res.json({ pickups });
}
export async function listAvailable(req, res) {
  const area = req.user.collectorProfile?.serviceArea || "";
  const rejected = await Pickup.find({ "rejectionHistory.collector": req.user._id }).distinct("_id");
  const filter = { status: "scheduled", scheduledAt: { $gt: new Date() }, _id: { $nin: rejected } };
  const pickups = await Pickup.find(filter).populate("household", "name householdProfile.address phone").sort({ scheduledAt: 1 }).lean();
  res.json({ pickups: pickups.map(p => ({ ...p, household: p.household ? { name: p.household.name, address: p.household.householdProfile?.address, phone: p.household.phone } : null })) });
}
export async function listMyPickups(req, res) {
  const pickups = await Pickup.find({ assignedCollector: req.user._id }).populate("household", "name phone").sort({ scheduledAt: 1 });
  res.json({ pickups });
}
export async function acceptPickup(req, res) {
  const pickup = await Pickup.findOneAndUpdate(
    { _id: req.params.id, status: "scheduled", assignedCollector: null, scheduledAt: { $gt: new Date() } },
    { $set: { status: "accepted", assignedCollector: req.user._id, acceptedAt: new Date() } }, { new: true }
  );
  if (!pickup) return res.status(409).json({ message: "This pickup is no longer available. Refresh the list." });
  await notify(pickup.household, "pickup", "Collector accepted your pickup", "A local collector accepted your scheduled pickup.", "pickup", pickup._id);
  res.json({ pickup });
}
export async function rejectPickup(req, res) {
  const pickup = await Pickup.findOne({ _id: req.params.id, status: "scheduled", assignedCollector: null });
  if (!pickup) return res.status(409).json({ message: "This pickup is no longer available to reject." });
  if (!pickup.rejectionHistory.some(r => r.collector.toString() === req.user._id.toString())) {
    pickup.rejectionHistory.push({ collector: req.user._id, at: new Date() });
    await pickup.save();
  }
  res.json({ message: "Pickup hidden from your available list. It remains available to other collectors." });
}
export async function cancelHouseholdPickup(req, res) {
  const pickup = await Pickup.findOne({ _id: req.params.id, household: req.user._id });
  if (!pickup) return res.status(404).json({ message: "Pickup not found." });
  if (["completed", "cancelled"].includes(pickup.status)) return res.status(409).json({ message: "This pickup cannot be cancelled." });
  if (!cancelAllowed(pickup)) return res.status(400).json({ message: "Cancellation closes 30 minutes before the scheduled pickup time." });
  pickup.status = "cancelled"; pickup.cancelledAt = new Date(); pickup.assignedCollector = null;
  await pickup.save();
  res.json({ pickup });
}
export async function cancelCollectorAssignment(req, res) {
  const pickup = await Pickup.findOne({ _id: req.params.id, assignedCollector: req.user._id, status: "accepted" });
  if (!pickup) return res.status(404).json({ message: "Accepted pickup not found." });
  if (!cancelAllowed(pickup)) return res.status(400).json({ message: "Assignment cancellation closes 30 minutes before the scheduled pickup time. Contact an administrator for an exception." });
  pickup.status = "scheduled"; pickup.assignedCollector = null; pickup.acceptedAt = undefined;
  await pickup.save();
  await notify(pickup.household, "pickup", "Collector assignment changed", "Your collector cancelled the assignment. Your pickup remains active and available to other collectors.", "pickup", pickup._id);
  res.json({ pickup, message: "Assignment cancelled; pickup is available to other collectors." });
}
export async function pickupQr(req, res) {
  const pickup = await Pickup.findOne({ _id: req.params.id, household: req.user._id }).select("+qrTokenHash");
  if (!pickup) return res.status(404).json({ message: "Pickup not found." });
  // Only the token hash is stored; QR payload is intentionally not recoverable from the database.
  // A freshly rotated token is generated and its hash stored before returning the QR.
  if (["completed", "cancelled"].includes(pickup.status)) return res.status(409).json({ message: "QR is unavailable for this pickup." });
  const token = crypto.randomBytes(32).toString("hex");
  pickup.qrTokenHash = crypto.createHash("sha256").update(token).digest("hex");
  await pickup.save();
  res.json({ qrCode: await QRCode.toDataURL(`GW:${pickup._id.toString()}:${token}`) });
}
export async function verifyQr(req, res) {
  const raw = String(req.body.code || "");
  const match = raw.match(/^GW:([a-f\d]{24}):([a-f\d]{64})$/i);
  if (!match) return res.status(400).json({ message: "Invalid Green Wallet QR or pickup code." });
  const tokenHash = crypto.createHash("sha256").update(match[2]).digest("hex");
  const pickup = await Pickup.findOne({ _id: match[1] }).select("+qrTokenHash");
  if (!pickup || !crypto.timingSafeEqual(Buffer.from(tokenHash, "hex"), Buffer.from(pickup.qrTokenHash, "hex"))) return res.status(404).json({ message: "Pickup code is invalid or expired." });
  if (pickup.assignedCollector?.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Only the assigned collector can verify this pickup." });
  if (pickup.status !== "accepted") return res.status(409).json({ message: "Only accepted pickups can be verified." });
  res.json({ pickup: { id: pickup._id, categories: pickup.categories, estimatedKg: pickup.estimatedKg, address: pickup.address } });
}
export async function completePickup(req, res) {
  const raw = String(req.body.code || "");
  const match = raw.match(/^GW:([a-f\d]{24}):([a-f\d]{64})$/i);
  if (!match) return res.status(400).json({ message: "Invalid QR payload." });
  const tokenHash = crypto.createHash("sha256").update(match[2]).digest("hex");
  const session = await Pickup.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const pickup = await Pickup.findOne({ _id: match[1] }).select("+qrTokenHash").session(session);
      if (!pickup || !crypto.timingSafeEqual(Buffer.from(tokenHash, "hex"), Buffer.from(pickup.qrTokenHash, "hex"))) {
        const error = new Error("Pickup code is invalid or expired."); error.status = 404; throw error;
      }
      if (pickup.assignedCollector?.toString() !== req.user._id.toString()) { const e = new Error("Only the assigned collector can verify this pickup."); e.status = 403; throw e; }
      if (pickup.status !== "accepted") { const e = new Error("Pickup has already been completed or is no longer eligible."); e.status = 409; throw e; }
      const weights = req.body.weights;
      if (!weights || typeof weights !== "object" || Array.isArray(weights)) { const e = new Error("Enter verified category weights."); e.status = 400; throw e; }
      const clean = {};
      for (const [category, kgValue] of Object.entries(weights)) {
        if (!pickup.categories.includes(category)) { const e = new Error(`Category ${category} was not selected for this pickup.`); e.status = 400; throw e; }
        const kg = Number(kgValue);
        if (!Number.isFinite(kg) || kg < 0 || kg > 1000) { const e = new Error("Each category weight must be between 0 and 1,000 kg."); e.status = 400; throw e; }
        if (kg > 0) clean[category] = kg;
      }
      if (!Object.keys(clean).length) { const e = new Error("At least one collected category must have a positive weight."); e.status = 400; throw e; }
      const reward = calculateReward(clean);
      pickup.status = "completed"; pickup.completedAt = new Date();
      pickup.verifiedWeights = clean; pickup.rewardPoints = reward.points; pickup.rewardBreakdown = reward.detail;
      pickup.verification = { collector: req.user._id, at: new Date() };
      await pickup.save({ session });
      if (reward.points > 0) await WalletTransaction.create([{
        household: pickup.household, type: "credit", points: reward.points,
        description: `Verified waste collection (${Object.values(clean).reduce((a,b)=>a+b,0)} kg)`,
        pickup: pickup._id, idempotencyKey: `pickup:${pickup._id}`
      }], { session });
      result = { pickup, reward };
    });
    await notify(result.pickup.household, "wallet", "Green Points credited", `${result.reward.points} points were credited for your verified pickup.`, "pickup", result.pickup._id);
    res.json(result);
  } finally { await session.endSession(); }
}
export async function pickupStats(req, res) {
  const filter = req.user.role === "household" ? { household: req.user._id, status: "completed" } : { assignedCollector: req.user._id, status: "completed" };
  const rows = await Pickup.find(filter).select("verifiedWeights rewardPoints");
  const kg = rows.reduce((sum, p) => sum + Object.values(p.verifiedWeights?.toObject?.() || p.verifiedWeights || {}).reduce((a, b) => a + Number(b), 0), 0);
  res.json({ completed: rows.length, verifiedKg: Math.round(kg * 100) / 100, points: rows.reduce((s, p) => s + p.rewardPoints, 0) });
}
