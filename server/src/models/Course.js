const mongoose = require("mongoose");
const createFileModel = require("../utils/fileModel");

if ((process.env.MONGODB_URI || "").startsWith("file:")) {
  module.exports = createFileModel("courses", {
    imagePath: "",
    imageUrl: "",
    adminWallet: "",
    isActive: true,
    txHash: "",
    deletedTxHash: "",
    deletedAt: null,
  });
  return;
}

const courseSchema = new mongoose.Schema(
  {
    blockchainCourseId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    imagePath: {
      type: String,
      default: "",
    },
    imageUrl: {
      type: String,
      default: "",
    },
    priceWei: {
      type: String,
      required: true,
    },
    adminWallet: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    txHash: {
      type: String,
      default: "",
    },
    deletedTxHash: {
      type: String,
      default: "",
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Course", courseSchema);
