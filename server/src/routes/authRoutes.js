const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();

function sanitizeUser(user) {
  return {
    id: user._id,
    walletAddress: user.walletAddress,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

router.post("/register", async (req, res) => {
  try {
    const { fullName, email, phone, password, walletAddress, avatarUrl } = req.body;

    if (!fullName || !email || !phone || !password || !walletAddress) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedWallet = walletAddress.toLowerCase().trim();
    const existingEmail = await User.findOne({ email: normalizedEmail });

    if (existingEmail) {
      return res.status(409).json({
        message: "Email này đã được đăng ký",
      });
    }

    const existingWallet = await User.findOne({
      walletAddress: normalizedWallet,
    });

    if (existingWallet?.role === "admin") {
      return res.status(409).json({
        message:
          "Ví này đang là ví admin. Hãy đổi sang tài khoản MetaMask khác để đăng ký học viên.",
      });
    }

    if (existingWallet) {
      return res.status(409).json({
        message: "Ví MetaMask này đã được đăng ký cho tài khoản khác",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName,
      email: normalizedEmail,
      phone,
      avatarUrl: avatarUrl || "",
      walletAddress: normalizedWallet,
      passwordHash,
    });

    res.status(201).json({ user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password, walletAddress } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Missing login credentials" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedWallet = walletAddress?.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: "Invalid email, password, or wallet" });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email, password, or wallet" });
    }

    if (user.role !== "admin" && user.walletAddress !== normalizedWallet) {
      return res.status(401).json({ message: "Invalid email, password, or wallet" });
    }

    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/users/:walletAddress", async (req, res) => {
  try {
    const { fullName, email, phone, password, avatarUrl } = req.body;
    const update = {};

    if (fullName) update.fullName = fullName;
    if (email) update.email = email.toLowerCase().trim();
    if (phone) update.phone = phone;
    if (avatarUrl !== undefined) update.avatarUrl = avatarUrl;
    if (password) update.passwordHash = await bcrypt.hash(password, 10);

    const user = await User.findOneAndUpdate(
      { walletAddress: req.params.walletAddress.toLowerCase().trim() },
      update,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ users: users.map(sanitizeUser) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
