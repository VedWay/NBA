import { Router } from "express";
import { createFaculty, getFacultyById, listFaculty, updateFaculty, uploadFacultyPhoto } from "../controllers/facultyController.js";
import { authRequired, optionalAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";

const router = Router();

router.get("/", optionalAuth, listFaculty);
router.get("/:id", optionalAuth, getFacultyById);
router.post("/", authRequired, requireRole(["admin", "faculty"]), createFaculty);
router.put("/:id", authRequired, requireRole(["admin", "faculty"]), updateFaculty);
router.put("/:id/photo", authRequired, requireRole(["admin", "faculty"]), uploadFacultyPhoto);

export default router;
