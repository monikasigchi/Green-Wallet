import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "./config/db.js";
import User from "./models/User.js";
import Product from "./models/Product.js";
async function run() {
  if (process.env.NODE_ENV === "production") throw new Error("Seed script is disabled in production.");
  await connectDB();
  const passwordHash = await bcrypt.hash("GreenWallet123!", 12);
  const accounts = [
    { name: "Demo Household", email: "household@greenwallet.local", role: "household", phone: "9000000001", householdProfile: { address: "12 Green Avenue, Demo City" } },
    { name: "Demo Collector", email: "collector@greenwallet.local", role: "collector", phone: "9000000002", collectorProfile: { serviceArea: "Demo City" } },
    { name: "Demo Reuse Co.", email: "organisation@greenwallet.local", role: "organisation", phone: "9000000003", organisationProfile: { organisationName: "Demo Reuse Co.", description: "Products made with recovered materials.", contactDetails: "9000000003" } }
  ];
  const users = {};
  for (const a of accounts) users[a.role] = await User.findOneAndUpdate({ email: a.email }, { $set: { ...a, passwordHash } }, { upsert: true, new: true, setDefaultsOnInsert: true });
  const sample = [
    { name: "Recycled Paper Notebook", description: "A sturdy everyday notebook made with recycled paper.", category: "Stationery", pointsRequired: 120, stock: 25 },
    { name: "Upcycled Utility Pouch", description: "A reusable pouch made from recovered textile materials.", category: "Accessories", pointsRequired: 220, stock: 12 },
    { name: "Reclaimed Desk Organiser", description: "A practical organiser crafted from recovered materials.", category: "Home", pointsRequired: 300, stock: 8 }
  ];
  for (const p of sample) await Product.findOneAndUpdate({ organisation: users.organisation._id, name: p.name }, { $set: { ...p, organisation: users.organisation._id, active: true } }, { upsert: true, new: true });
  console.log("Seed complete. Development-only credentials:");
  console.log("household@greenwallet.local / GreenWallet123!");
  console.log("collector@greenwallet.local / GreenWallet123!");
  console.log("organisation@greenwallet.local / GreenWallet123!");
  await mongoose.disconnect();
}
run().catch(async e => { console.error(e); await mongoose.disconnect(); process.exit(1); });
