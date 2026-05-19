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
    const currentCount = Number(await instance.courseCount());

    const { courses } = await getJson(
      "http://localhost:5000/api/courses?includeInactive=true"
    );
    const activeCourses = courses
      .filter((course) => course.isActive)
      .sort(
        (first, second) =>
          Number(first.blockchainCourseId) - Number(second.blockchainCourseId)
      );

    const coursesToSync = activeCourses.slice(currentCount);

    console.log(
      `Contract has ${currentCount} courses. Syncing ${coursesToSync.length} remaining active courses...`
    );

    for (const course of coursesToSync) {
      const receipt = await instance.addCourse(
        course.name,
        course.description,
        "",
        course.priceWei,
        {
          from: admin,
          gas: 6000000,
        }
      );

      console.log(
        `Synced course #${course.blockchainCourseId}: ${course.name} (${receipt.tx})`
      );
    }

    console.log("Course sync completed.");
    callback();
  } catch (error) {
    callback(error);
  }
};
