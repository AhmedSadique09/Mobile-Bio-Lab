import express from 'express';
import { logScanEvent, getScanEvents } from '../controllers/scanEvent.controller.js';
import { jwtGuard } from '../middlewares/jwt.middleware.js';

const router = express.Router();

// Log scan event (POST /api/scan-event)
router.post('/', jwtGuard, logScanEvent);

// Get scan events (GET /api/scan-event)
// Admin can see all scan events, regular users can only see their own
router.get('/', jwtGuard, getScanEvents);

export default router;

