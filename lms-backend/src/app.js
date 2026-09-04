const express = require("express");
const cors = require("cors");
const path = require("path");
const routes = require("./routes"); // Updated announcement routes

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/admin-restart", (req, res) => {
  res.status(200).json({ message: "Restarting server..." });
  setTimeout(() => process.exit(0), 300);
});

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  })
);

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api", routes);

module.exports = app;
