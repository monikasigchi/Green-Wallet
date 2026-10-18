import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";
const port = Number(process.env.PORT) || 5000;
try {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error("JWT_SECRET must be set to at least 32 characters.");
  await connectDB();
  app.listen(port, () => console.log(`Green Wallet API listening on http://localhost:${port}`));
} catch (error) {
  console.error(`Startup failed: ${error.message}`);
  process.exit(1);
}
