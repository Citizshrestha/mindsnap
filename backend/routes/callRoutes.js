import express from 'express';

import { initiateCall } from '../controllers/callController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.post("/initiate", protect, initiateCall);

export default router;

