const express = require("express");
const Sale = require("../models/Sale");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const query = req.body.txHash
      ? { txHash: req.body.txHash }
      : {
          blockchainCourseId: req.body.blockchainCourseId,
          buyerWallet: req.body.buyerWallet,
        };
    const sale = await Sale.findOneAndUpdate(query, req.body, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });

    res.status(201).json({ sale });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const sales = await Sale.find().sort({ createdAt: -1 });
    res.json({ sales });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
