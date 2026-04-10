import { Router } from "express";
import { createEntry, listEntries, updateEntry } from "../controllers/entryController.js";
import { authRequired, optionalAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";

const router = Router();

router.get("/:faculty_id", optionalAuth, (req, res) => {
  req.params.table = "fdp";
  return listEntries(req, res);
});

router.post("/", authRequired, requireRole(["faculty", "admin"]), (req, res) => {
  req.params.table = "fdp";
  return createEntry(req, res);
});

router.put("/:id", authRequired, requireRole(["faculty", "admin"]), (req, res) => {
  req.params.table = "fdp";
  return updateEntry(req, res);
});

export default router;
