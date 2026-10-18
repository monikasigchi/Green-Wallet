import WalletTransaction from "../models/WalletTransaction.js";
export async function wallet(req, res) {
  const allTransactions = await WalletTransaction.find({ household: req.user._id }).sort({ createdAt: -1 }).populate("pickup", "_id").populate("order", "orderCode");
  const transactions = allTransactions.slice(0, 100);
  const credits = allTransactions.filter(t => t.type === "credit").reduce((s,t)=>s+t.points,0);
  const debits = allTransactions.filter(t => t.type === "debit").reduce((s,t)=>s+t.points,0);
  res.json({ balance: credits - debits, totalEarned: credits, totalSpent: debits, transactions });
}
