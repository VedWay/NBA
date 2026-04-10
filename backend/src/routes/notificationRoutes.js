import { Router } from "express";
import { listMyNotifications, markNotificationRead } from "../controllers/notificationController.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

router.use(authRequired);
router.get("/", listMyNotifications);
router.put("/:id/read", markNotificationRead);

export default router;
