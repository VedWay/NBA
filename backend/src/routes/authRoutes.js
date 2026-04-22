import { Router } from "express";
import { login, register, googleLogin } from "../controllers/authController.js";

const router = Router();

router.post("/login", login);
router.post("/register", register);
router.post("/google-login", googleLogin);

export default router;
