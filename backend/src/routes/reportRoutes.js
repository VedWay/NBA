import { Router } from "express";
import { exportFacultyExcel, getFacultySummary } from "../controllers/reportController.js";
import { authRequired } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";

const router = Router();

router.get("/faculty/:id", authRequired, requireRole(["admin", "faculty"]), getFacultySummary);
router.get("/export/faculty/:id", authRequired, requireRole(["admin", "faculty"]), exportFacultyExcel);

export default router;
