import { Router } from "express";
import {
  createAchievement,
  deleteAchievement,
  listAchievementsAdmin,
  listPublicAchievements,
  updateAchievement,
} from "../controllers/achievementController.js";
import { authRequired } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";

const router = Router();

router.get("/public", listPublicAchievements);
router.get("/admin", authRequired, requireRole(["admin"]), listAchievementsAdmin);
router.post("/admin", authRequired, requireRole(["admin"]), createAchievement);
router.put("/admin/:id", authRequired, requireRole(["admin"]), updateAchievement);
router.delete("/admin/:id", authRequired, requireRole(["admin"]), deleteAchievement);

export default router;
