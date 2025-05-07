import express from "express";
import { getPostsByHashtag } from "../controllers/hashtagController";
import protect from "../middleware/authMiddleware";

const router = express.Router();

router.get("/:name",protect,  getPostsByHashtag);

export default router;