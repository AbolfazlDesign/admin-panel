// server/src/routes/dashboard.js
const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const authenticate = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");

router.get(
  "/stats",
  authenticate,
  roleCheck("admin", "manager"),
  dashboardController.getStats,
);

module.exports = router;
