import express from 'express';
import { verifyAdmin } from '../utils/verifyAdmin.js';

const router = express.Router();

// Protected admin-only route
router.get('/dashboard', verifyAdmin, (req, res) => {
  res.json({ message: 'Welcome Admin! You have full access.' });
});

export default router;
