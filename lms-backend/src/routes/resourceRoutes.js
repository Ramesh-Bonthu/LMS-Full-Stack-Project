const express = require("express");
const router = express.Router();
const resourceController = require("../controllers/resourceController");
const { verifyToken, isAdmin, isFaculty } = require("../middleware/auth");

router.get("/", verifyToken, resourceController.getAllResources);
router.post("/", verifyToken, resourceController.createResource); // Faculty/Admin can upload
router.delete("/:id", verifyToken, resourceController.deleteResource);

module.exports = router;
