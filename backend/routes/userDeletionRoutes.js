import express from "express";
import { 
  deleteUserAccount, 
  deactivateUserAccount 
} from "../controllers/userDeletionController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Soft delete (deactivate) user account
router.patch("/deactivate/:userId", protect, deactivateUserAccount);

// Hard delete user account (permanent deletion)
router.delete("/delete/:userId", protect, deleteUserAccount);

export default router;
