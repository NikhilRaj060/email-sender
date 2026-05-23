const express = require("express");
const router = express.Router();

const authController = require("../controller/authController");

router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/refresh", authController.refreshAccessToken);
router.post("/logout", authController.logoutUser);

module.exports = router;
