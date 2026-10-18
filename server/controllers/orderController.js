import crypto from "node:crypto";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import WalletTransaction from "../models/WalletTransaction.js";
import { notify } from "../utils/notify.js";
export async function redeem(req, res) {
  const quantity = Number(req.body.quantity || 1);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) return res.status(400).json({ message: "Quantity must be an integer from 1 to 50." });
  const session = await mongoose.startSession();
  let created;
  try {
    await session.withTransaction(async () => {
      const product = await Product.findOneAndUpdate({ _id: req.params.productId, active: true, stock: { $gte: quantity } }, { $inc: { stock: -quantity } }, { new: true, session });
      if (!product) { const e = new Error("Product is unavailable or there is insufficient stock."); e.status = 409; throw e; }
      const txs = await WalletTransaction.find({ household: req.user._id }).session(session);
      const balance = txs.reduce((s,t)=>s+(t.type === "credit" ? t.points : -t.points),0);
      const totalPoints = product.pointsRequired * quantity;
      if (balance < totalPoints) { const e = new Error(`You need ${totalPoints - balance} more Green Points.`); e.status = 400; throw e; }
      const household = await User.findById(req.user._id).session(session);
      const orderCode = `GW-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
      const [order] = await Order.create([{
        household: req.user._id, organisation: product.organisation, product: product._id, orderCode, idempotencyKey: requestKey || undefined,
        productSnapshot: { name: product.name, image: product.images[0] || "", category: product.category },
        quantity, pointsPerItem: product.pointsRequired, totalPoints,
        deliverySnapshot: { address: household.householdProfile?.address || "", phone: household.phone, householdName: household.name }
      }], { session });
      await WalletTransaction.create([{
        household: req.user._id, type: "debit", points: totalPoints, description: `Redeemed ${quantity} × ${product.name}`,
        order: order._id, idempotencyKey: `order:${order._id}`
      }], { session });
      created = order;
    });
  } finally { await session.endSession(); }
  await notify(created.organisation, "order", "New marketplace order", `Order ${created.orderCode} has been placed.`, "order", created._id);
  await notify(req.user._id, "order", "Order placed", `Your order ${created.orderCode} has been placed.`, "order", created._id);
  res.status(201).json({ order: created });
}
export async function householdOrders(req, res) {
  const filter = { household: req.user._id };
  if (req.query.status === "completed") filter.status = "received";
  else if (req.query.status === "active") filter.status = { $in: ["placed","processing","dispatched"] };
  res.json({ orders: await Order.find(filter).populate("organisation", "name organisationProfile.organisationName").sort({ createdAt: -1 }) });
}
export async function organisationOrders(req, res) {
  const filter = { organisation: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  res.json({ orders: await Order.find(filter).populate("household", "name email phone householdProfile.address").sort({ createdAt: -1 }) });
}
export async function updateOrderStatus(req, res) {
  const allowed = { placed: ["processing"], processing: ["dispatched"] };
  const { status, trackingInfo = "" } = req.body;
  if (!["processing","dispatched"].includes(status)) return res.status(400).json({ message: "Organisations may move orders to Processing or Dispatched." });
  const order = await Order.findOne({ _id: req.params.id, organisation: req.user._id });
  if (!order) return res.status(404).json({ message: "Order not found for your organisation." });
  if (!allowed[order.status]?.includes(status)) return res.status(409).json({ message: `Cannot move an order from ${order.status} to ${status}.` });
  order.status = status; order.trackingInfo = String(trackingInfo).slice(0,300);
  if (status === "dispatched") order.dispatchedAt = new Date();
  await order.save();
  await notify(order.household, "order", status === "dispatched" ? "Order dispatched" : "Order processing", `Order ${order.orderCode} is now ${status}.`, "order", order._id);
  res.json({ order });
}
export async function confirmReceived(req, res) {
  const order = await Order.findOne({ _id: req.params.id, household: req.user._id });
  if (!order) return res.status(404).json({ message: "Order not found." });
  if (order.status !== "dispatched") return res.status(409).json({ message: "Only dispatched orders can be confirmed as received." });
  order.status = "received"; order.receivedAt = new Date(); await order.save();
  await notify(order.organisation, "order", "Order received", `Household confirmed order ${order.orderCode} as received.`, "order", order._id);
  res.json({ order });
}
