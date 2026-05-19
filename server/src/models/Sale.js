const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema(
  {
    blockchainCourseId: {
      type: String,
      required: true,
      index: true,
    },
    courseName: {
      type: String,
      default: "",
      trim: true,
    },
    buyerWallet: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    buyerName: {
      type: String,
      default: "",
      trim: true,
    },
    priceWei: {
      type: String,
      required: true,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    txHash: {
      type: String,
      default: "",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Sale", saleSchema);
