const http = require("http");
const CourseCertificate = artifacts.require("CourseCertificate");

function getJson(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let body = "";

        res.on("data", (chunk) => {
          body += chunk;
        });

        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(error);
          }
        });
      })
      .on("error", reject);
  });
}

module.exports = async function (callback) {
  try {
    const instance = await CourseCertificate.deployed();
    const admin = await instance.admin();
    const existingCodes = await instance.getAllCertificateCodes({ from: admin });
    const existingCodeSet = new Set(existingCodes.map((code) => String(code)));

    const { certificates } = await getJson(
      "http://localhost:5000/api/certificates"
    );

    const certificatesToSync = certificates.filter(
      (certificate) =>
        certificate.certCode &&
        certificate.studentName &&
        certificate.courseName &&
        certificate.studentWallet &&
        !existingCodeSet.has(String(certificate.certCode))
    );

    console.log(
      `Contract has ${existingCodes.length} certificates. Syncing ${certificatesToSync.length} certificates from database...`
    );

    for (const certificate of certificatesToSync) {
      const receipt = await instance.issueCertificate(
        certificate.certCode,
        certificate.studentName,
        certificate.courseName,
        certificate.studentWallet,
        {
          from: admin,
          gas: 6000000,
        }
      );

      console.log(
        `Synced certificate ${certificate.certCode}: ${certificate.studentName} - ${certificate.courseName} (${receipt.tx})`
      );
    }

    console.log("Certificate sync completed.");
    callback();
  } catch (error) {
    callback(error);
  }
};
