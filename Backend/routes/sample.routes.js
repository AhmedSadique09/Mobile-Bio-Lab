import express from 'express';
import { createSample, getSamples, getSampleById, getSampleBySampleId, updateSampleStatus } from '../controllers/sample.controller.js';
import { jwtGuard } from '../middlewares/jwt.middleware.js';

const router = express.Router();

// Create sample (POST /api/sample)
router.post('/', jwtGuard, createSample);

// Get all samples (GET /api/sample)
// Admin can see all samples, regular users can only see their own
router.get('/', jwtGuard, getSamples);

// Get sample by sampleId (GET /api/sample/by-sample-id/:sampleId)
// This route must come before /:id to avoid conflicts
router.get('/by-sample-id/:sampleId', jwtGuard, getSampleBySampleId);

// Get sample by ID (GET /api/sample/:id)
router.get('/:id', jwtGuard, getSampleById);

// Update sample status (PUT /api/sample/:id/status)
// Admin can update any sample, regular users can only update their own
router.put('/:id/status', jwtGuard, updateSampleStatus);

export default router;

