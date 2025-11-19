import express from 'express';
import { getUserAnalytics, getAdminAnalytics } from '../controllers/analytics.controller.js';
import { jwtGuard } from '../middlewares/jwt.middleware.js';

const router = express.Router();

// Get user analytics (for regular users)
router.get('/user', jwtGuard, getUserAnalytics);

// Get admin analytics (for admins only)
router.get('/admin', jwtGuard, getAdminAnalytics);

export default router;

