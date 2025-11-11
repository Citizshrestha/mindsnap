import express from "express";
import { 
  deleteUserAccount, 
  deactivateUserAccount,
  cleanupOrphanedReferences
} from "../controllers/userDeletionController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Soft delete (deactivate) user account
router.patch("/deactivate/:userId", protect, deactivateUserAccount);

// Hard delete user account (permanent deletion)
router.delete("/delete/:userId", protect, deleteUserAccount);

// Clean up orphaned user references (admin only - can add admin middleware later)
router.post("/cleanup-orphaned", protect, cleanupOrphanedReferences);

export default router;
