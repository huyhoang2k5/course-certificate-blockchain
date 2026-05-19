const express = require("express");
const Certificate = require("../models/Certificate");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const certificate = await Certificate.findOneAndUpdate(
      { certCode: req.body.certCode },
      req.body,
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    res.status(201).json({ certificate });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const query = req.query.studentWallet
      ? { studentWallet: req.query.studentWallet.toLowerCase().trim() }
      : {};
    const certificates = await Certificate.find(query).sort({ createdAt: -1 });
    res.json({ certificates });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
