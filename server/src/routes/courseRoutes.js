const express = require("express");
const multer = require("multer");
const path = require("path");
const Course = require("../models/Course");

const router = express.Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(__dirname, "..", "..", "uploads"));
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({ storage });

router.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Image file is required" });
  }

  res.status(201).json({
    imagePath: `/uploads/${req.file.filename}`,
  });
});

router.post("/", async (req, res) => {
  try {
    const course = await Course.findOneAndUpdate(
      { blockchainCourseId: req.body.blockchainCourseId },
      req.body,
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    res.status(201).json({ course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const query = req.query.includeInactive === "true" ? {} : { isActive: true };
    const courses = await Course.find(query).sort({ createdAt: -1 });
    res.json({ courses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:blockchainCourseId", async (req, res) => {
  try {
    const course = await Course.findOneAndUpdate(
      { blockchainCourseId: req.params.blockchainCourseId },
      req.body,
      { new: true }
    );

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json({ course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:blockchainCourseId", async (req, res) => {
  try {
    const course = await Course.findOneAndUpdate(
      { blockchainCourseId: req.params.blockchainCourseId },
      {
        isActive: false,
        deletedTxHash: req.query.txHash || "",
        deletedAt: new Date(),
      },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json({ course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
