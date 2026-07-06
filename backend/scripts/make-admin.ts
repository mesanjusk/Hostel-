import "dotenv/config";
import mongoose from "mongoose";

import { User } from "@/models/User";
import { normalizeMobile } from "@/lib/phone";
import { generatePin, hashPin } from "@/lib/pin";

async function main() {
  const rawMobile = process.argv[2];
  if (!rawMobile) {
    console.error("Usage: npm run make-admin -- <mobile-number>");
    process.exit(1);
  }

  const mobile = normalizeMobile(rawMobile);
  if (!mobile) {
    console.error("Invalid mobile number. Use a 10-digit Indian mobile number.");
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable");
  }

  await mongoose.connect(uri);

  const existing = await User.findOne({ mobile });

  if (existing) {
    existing.role = "admin";
    await existing.save();
    console.log(`+${mobile} (${existing.name ?? "unnamed"}) is now an admin.`);
    await mongoose.disconnect();
    return;
  }

  const pin = generatePin();
  const loginPinHash = await hashPin(pin);
  await User.create({ mobile, role: "admin", loginPinHash });

  console.log(`Created admin account +${mobile}.`);
  console.log(`Login code: ${pin}`);
  console.log("Save this now — it cannot be retrieved again, only regenerated from the admin panel.");
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("Failed to set admin:", error);
  process.exit(1);
});
