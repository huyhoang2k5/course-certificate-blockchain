const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const connectDatabase = require("../utils/connectDatabase");
const User = require("../models/User");

dotenv.config();

async function seedAdmin() {
  await connectDatabase();

  const adminWalletAddress = process.env.ADMIN_WALLET_ADDRESS;

  if (!adminWalletAddress) {
    throw new Error("Missing ADMIN_WALLET_ADDRESS in server/.env");
  }

  const passwordHash = await bcrypt.hash("admin123", 10);
  const user = await User.findOneAndUpdate(
    { email: "admin123@gmail.com" },
    {
      fullName: "EduCert Admin",
      email: "admin123@gmail.com",
      phone: "0000000000",
      walletAddress: adminWalletAddress.toLowerCase().trim(),
      passwordHash,
      role: "admin",
    },
    {
      new: true,
      upsert: true,
    }
  );

  console.log("Admin account ready:");
  console.log(`Email: ${user.email}`);
  console.log("Password: admin123");
  process.exit(0);
}

seedAdmin().catch((error) => {
  console.error(error);
  process.exit(1);
});
