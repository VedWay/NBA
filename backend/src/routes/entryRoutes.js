import { Router } from "express";
import { createEntry, deleteEntry, listEntries, updateEntry } from "../controllers/entryController.js";
import { authRequired, optionalAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";

const router = Router();

router.get("/:table/:faculty_id", optionalAuth, listEntries);
router.post("/:table", authRequired, requireRole(["faculty", "admin"]), createEntry);
router.put("/:table/:id", authRequired, requireRole(["faculty", "admin"]), updateEntry);
router.delete("/:table/:id", authRequired, requireRole(["faculty", "admin"]), deleteEntry);

export default router;
