import express from 'express';
import {
    createProtocol,
    getProtocols,
    getProtocolById,
    updateProtocol,
    deleteProtocol,
    togglePublishStatus
} from '../controllers/protocol.controller.js';
import { jwtGuard } from '../middlewares/jwt.middleware.js';

const router = express.Router();

// Get all protocols (filtered by publish status for non-admin)
router.get('/', jwtGuard, getProtocols);

// Get a specific protocol by ID
router.get('/:id', jwtGuard, getProtocolById);

// Create a new protocol (Admin only)
router.post('/', jwtGuard, createProtocol);

// Update a protocol (Admin only)
router.put('/:id', jwtGuard, updateProtocol);

// Toggle publish status (Admin only) - supports both PATCH and PUT
router.patch('/:id/publish', jwtGuard, togglePublishStatus);
router.put('/:id/publish', jwtGuard, togglePublishStatus);

// Delete a protocol (Admin only)
router.delete('/:id', jwtGuard, deleteProtocol);

export default router;
