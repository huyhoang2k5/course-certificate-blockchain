const CourseCertificate = artifacts.require("CourseCertificate");
const fs = require("fs");
const path = require("path");

function readAdminWalletAddress() {
  const envPath = path.join(__dirname, "..", "server", ".env");

  if (!fs.existsSync(envPath)) {
    return "";
  }

  const envFile = fs.readFileSync(envPath, "utf8");
  const adminLine = envFile
    .split(/\r?\n/)
    .find((line) => line.startsWith("ADMIN_WALLET_ADDRESS="));

  return adminLine ? adminLine.split("=").slice(1).join("=").trim() : "";
}

module.exports = function (deployer, network, accounts) {
  const adminWalletAddress = readAdminWalletAddress();
  const contractAdmin = adminWalletAddress || accounts[0];

  deployer.deploy(CourseCertificate, contractAdmin);
};
