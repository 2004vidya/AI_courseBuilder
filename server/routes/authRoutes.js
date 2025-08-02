const express = require("express");
const router = express.Router();
const { signup, login, checkAuth, logout } = require("../controllers/authController");

router.post("/register", signup);
router.post("/login", login);
router.get("/check-auth", checkAuth);
router.post("/logout", logout);

module.exports = router;
