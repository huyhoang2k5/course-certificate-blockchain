const mongoose = require("mongoose");
const createFileModel = require("../utils/fileModel");

if ((process.env.MONGODB_URI || "").startsWith("file:")) {
  module.exports = createFileModel("certificates", {
    issuerWallet: "",
    isValid: true,
    txHash: "",
  });
  return;
}

const certificateSchema = new mongoose.Schema(
  {
    certCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    studentWallet: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    courseName: {
      type: String,
      required: true,
      trim: true,
    },
    issuerWallet: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },
    issueDate: {
      type: Date,
      required: true,
    },
    isValid: {
      type: Boolean,
      default: true,
    },
    txHash: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Certificate", certificateSchema);
