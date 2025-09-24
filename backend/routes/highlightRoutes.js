import express from "express";
import { 
  createHighlight, 
  getUserHighlights, 
  getHighlightDetails, 
  updateHighlight, 
  deleteHighlight,
  getAvailableStories 
} from "../controllers/highlightController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Create a new highlight
router.post("/", protect, createHighlight);

// Get user's available stories for highlight creation
router.get("/available-stories", protect, getAvailableStories);

// Get user's highlights (current user if no userId provided)
router.get("/:userId?", protect, getUserHighlights);

// Get highlight details with all stories
router.get("/details/:highlightId", protect, getHighlightDetails);

// Update highlight
router.put("/:highlightId", protect, updateHighlight);

// Delete highlight
router.delete("/:highlightId", protect, deleteHighlight);

export default router;