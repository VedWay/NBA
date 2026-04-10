import { Router } from "express";
import { createEntry, deleteEntry, listEntries, updateEntry } from "../controllers/entryController.js";
import { authRequired, optionalAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";

const router = Router();

router.get("/:faculty_id", optionalAuth, (req, res) => {
  req.params.table = "publications";
  return listEntries(req, res);
});

router.post("/", authRequired, requireRole(["faculty", "admin"]), (req, res) => {
  req.params.table = "publications";
  return createEntry(req, res);
});

router.put("/:id", authRequired, requireRole(["faculty", "admin"]), (req, res) => {
  req.params.table = "publications";
  return updateEntry(req, res);
});

router.delete("/:id", authRequired, requireRole(["faculty", "admin"]), (req, res) => {
  req.params.table = "publications";
  return deleteEntry(req, res);
});

export default router;
