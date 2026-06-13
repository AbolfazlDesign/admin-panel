// server/src/routes/auth.js
const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const authController = require("../controllers/authController");
const authenticate = require("../middleware/auth");

// Validation middleware
const validateErrors = (req, res, next) => {
  const { validationResult } = require("express-validator");
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      data: null,
      message: errors.array()[0].msg,
    });
  }
  next();
};

router.post(
  "/register",
  [
    body("name")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("نام باید ۲ تا ۱۰۰ کاراکتر باشد"),
    body("email").isEmail().normalizeEmail().withMessage("ایمیل معتبر نیست"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("رمز عبور حداقل ۶ کاراکتر"),
    validateErrors,
  ],
  authController.register,
);

router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("ایمیل معتبر نیست"),
    body("password").notEmpty().withMessage("رمز عبور الزامی است"),
    validateErrors,
  ],
  authController.login,
);

router.post("/refresh", authController.refreshToken);
router.post("/logout", authenticate, authController.logout);
router.get("/profile", authenticate, authController.getProfile);

module.exports = router;
