import express from "express";
import * as authController from "../controllers/auth.controller.js";
const router = express.Router();

router.post("/login", authController.login);
router.post("/register", authController.register, authController.sendOTP);
router.post("/resend-otp", authController.resendOTP, authController.sendOTP);
router.post("/verify-otp", authController.verifyOTP);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);
export default router;
