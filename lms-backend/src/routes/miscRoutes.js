const express = require("express");
const router = express.Router();
const miscController = require("../controllers/miscController");
const { verifyToken } = require("../middleware/auth");

router.get("/performance", verifyToken, miscController.getPerformance);
router.get("/health", miscController.healthCheck);

module.exports = router;
