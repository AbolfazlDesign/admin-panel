// server/src/routes/subscriptions.js
const express = require("express");
const router = express.Router();
const subController = require("../controllers/subscriptionController");
const authenticate = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");

router.get("/plans", subController.getPlans); // Public
router.use(authenticate);
router.get("/my", subController.getMySubscription);
router.post("/subscribe", subController.subscribe);
router.post("/cancel", subController.cancelSubscription);
router.get(
  "/all",
  roleCheck("admin", "manager"),
  subController.getAllSubscriptions,
);

module.exports = router;
