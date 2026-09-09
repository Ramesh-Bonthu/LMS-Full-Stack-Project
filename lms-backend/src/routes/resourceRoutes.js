const express = require("express");
const router = express.Router();
const resourceController = require("../controllers/resourceController");
const { verifyToken, requireRole } = require("../middleware/auth");

const upload = require("../middleware/upload");

router.get("/", verifyToken, resourceController.getAllResources);
router.post(
  "/",
  verifyToken,
  requireRole("FACULTY", "ADMIN"),
  upload.any(),
  resourceController.createResource
);
router.patch("/:id/status", verifyToken, requireRole("ADMIN"), resourceController.updateResourceStatus);

router.delete("/:id", verifyToken, resourceController.deleteResource);

module.exports = router;

