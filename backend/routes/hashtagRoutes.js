// routes/hashtagRoutes.js
import express from "express";
import { getPostsByHashtag, getAllHashtags } from "../controllers/hashtagController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getAllHashtags);
router.get("/:name", protect, getPostsByHashtag);

export default router;