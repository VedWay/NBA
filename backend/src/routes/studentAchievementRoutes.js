import { Router } from "express";
import { 
  addAchievement, 
  getAchievements, 
  getPending, 
  getRejected, 
  updateStatus, 
  getFilters 
} from "../controllers/studentAchievementController.js";
import { upload } from "../middleware/upload.js";

const router = Router();

// Public routes
router.get("/", getAchievements);
router.get("/filters", getFilters);

// Submission route
router.post("/add", upload.single("proof"), addAchievement);

// Admin routes (Note: auth middleware can be added here if needed, 
// matching the source project's behavior for now which was unprotected)
router.get("/pending", getPending);
router.get("/rejected", getRejected);
router.put("/update/:id", updateStatus);

export default router;
