const express = require("express");
const router = express.Router();
const resourceController = require("../controllers/resourceController");
const { verifyToken, requireRole } = require("../middleware/auth");

router.get("/", verifyToken, resourceController.getAllResources);
router.post("/", verifyToken, requireRole("FACULTY", "ADMIN"), resourceController.createResource);
router.delete("/:id", verifyToken, resourceController.deleteResource);

module.exports = router;
