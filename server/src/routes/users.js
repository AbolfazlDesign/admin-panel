// server/src/routes/users.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authenticate = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");

router.use(authenticate);

router.get("/", roleCheck("admin", "manager"), userController.getUsers);
router.get("/:id", roleCheck("admin", "manager"), userController.getUser);
router.put("/:id", roleCheck("admin"), userController.updateUser);
router.delete("/:id", roleCheck("admin"), userController.deleteUser);

module.exports = router;
