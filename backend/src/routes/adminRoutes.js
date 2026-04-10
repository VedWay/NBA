import { Router } from "express";
import { approveEntry, getAuditTimeline, getPendingEntries, rejectEntry } from "../controllers/adminController.js";
import { authRequired } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";

const router = Router();

router.use(authRequired, requireRole(["admin"]));

router.get("/pending", getPendingEntries);
router.get("/audit", getAuditTimeline);
router.put("/approve/:table/:id", approveEntry);
router.delete("/reject/:table/:id", rejectEntry);

export default router;
