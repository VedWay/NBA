import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import {
  createAchievement,
  createStudent,
  listAchievementsAdmin,
  listPublicAchievements,
  listReferenceData,
  updateAchievementStatus,
  uploadAchievementFile,
} from "../controllers/studentAchievementController.js";

const router = Router();

router.get("/achievements/public", listPublicAchievements);
router.get("/reference", listReferenceData);

router.get("/achievements/admin", authRequired, requireRole(["admin"]), listAchievementsAdmin);
router.post("/students", authRequired, requireRole(["admin"]), createStudent);
router.post("/achievements", authRequired, requireRole(["faculty", "admin"]), createAchievement);
router.put("/achievements/:id/status", authRequired, requireRole(["admin"]), updateAchievementStatus);
router.post("/files", authRequired, requireRole(["faculty", "admin"]), uploadAchievementFile);

export default router;
