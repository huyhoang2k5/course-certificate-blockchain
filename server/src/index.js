const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const connectDatabase = require("./utils/connectDatabase");
const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const certificateRoutes = require("./routes/certificateRoutes");
const saleRoutes = require("./routes/saleRoutes");

const app = express();
const port = process.env.PORT || 5000;
const allowedOrigins = new Set([
  process.env.CLIENT_ORIGIN || "http://localhost:3000",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked origin: ${origin}`));
    },
  })
);
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "EduCert Chain API",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/sales", saleRoutes);

connectDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`EduCert Chain API running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Cannot start server:", error.message);
    process.exit(1);
  });
