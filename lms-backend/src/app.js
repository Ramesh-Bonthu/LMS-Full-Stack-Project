const express = require("express");
const cors = require("cors");
const path = require("path");
const routes = require("./routes");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:8080", "http://localhost:8082"],
    credentials: true,
  })
);

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api", routes);

module.exports = app;
