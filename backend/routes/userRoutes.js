import express from "express";
import { followUser } from "../controllers/userController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/:id/follow", protect, followUser);

export default router;