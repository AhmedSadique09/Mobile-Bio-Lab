import * as ProtocolService from '../services/protocol.service.js';
import User from '../models/User.js';

export const createProtocol = async (req, res) => {
    try {
        const userId = req.user.id;
        const protocolData = req.body;

        // Check if user is admin
        const user = await User.findByPk(userId);
        if (!user || user.role !== 'Admin') {
            return res.status(403).json({
                statusCode: 403,
                message: 'Only admin can create protocols'
            });
        }

        const protocol = await ProtocolService.createProtocol(userId, protocolData);

        return res.status(201).json({
            statusCode: 201,
            message: 'Protocol created successfully',
            payload: protocol
        });
    } catch (err) {
        console.error('Create protocol error:', err);
        return res.status(err.status || 500).json({
            statusCode: err.status || 500,
            message: err.message || 'Failed to create protocol'
        });
    }
};

export const getProtocols = async (req, res) => {
    try {
        const userId = req.user.id;
        const { category, difficulty, search, page = 1, limit = 10 } = req.query;

        // Check if user is admin
        const user = await User.findByPk(userId);
        const isAdmin = user.role === 'Admin';

        const result = await ProtocolService.getProtocols(
            isAdmin,
            { category, difficulty, search },
            parseInt(page),
            parseInt(limit)
        );

        return res.status(200).json({
            statusCode: 200,
            message: 'Protocols retrieved successfully',
            payload: result.protocols,
            pagination: result.pagination
        });
    } catch (err) {
        console.error('Get protocols error:', err);
        return res.status(err.status || 500).json({
            statusCode: err.status || 500,
            message: err.message || 'Failed to retrieve protocols'
        });
    }
};

export const getProtocolById = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Check if user is admin
        const user = await User.findByPk(userId);
        const isAdmin = user.role === 'Admin';

        const protocol = await ProtocolService.getProtocolById(parseInt(id), isAdmin);

        return res.status(200).json({
            statusCode: 200,
            message: 'Protocol retrieved successfully',
            payload: protocol
        });
    } catch (err) {
        return res.status(err.status || 500).json({
            statusCode: err.status || 500,
            message: err.message || 'Failed to retrieve protocol'
        });
    }
};

export const updateProtocol = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const updateData = req.body;

        // Check if user is admin
        const user = await User.findByPk(userId);
        if (!user || user.role !== 'Admin') {
            return res.status(403).json({
                statusCode: 403,
                message: 'Only admin can update protocols'
            });
        }

        const protocol = await ProtocolService.updateProtocol(parseInt(id), userId, updateData);

        return res.status(200).json({
            statusCode: 200,
            message: 'Protocol updated successfully',
            payload: protocol
        });
    } catch (err) {
        return res.status(err.status || 500).json({
            statusCode: err.status || 500,
            message: err.message || 'Failed to update protocol'
        });
    }
};

export const deleteProtocol = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Check if user is admin
        const user = await User.findByPk(userId);
        if (!user || user.role !== 'Admin') {
            return res.status(403).json({
                statusCode: 403,
                message: 'Only admin can delete protocols'
            });
        }

        await ProtocolService.deleteProtocol(parseInt(id));

        return res.status(200).json({
            statusCode: 200,
            message: 'Protocol deleted successfully'
        });
    } catch (err) {
        return res.status(err.status || 500).json({
            statusCode: err.status || 500,
            message: err.message || 'Failed to delete protocol'
        });
    }
};

export const togglePublishStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Check if user is admin
        const user = await User.findByPk(userId);
        if (!user || user.role !== 'Admin') {
            return res.status(403).json({
                statusCode: 403,
                message: 'Only admin can publish/unpublish protocols'
            });
        }

        const protocol = await ProtocolService.togglePublishStatus(parseInt(id));

        return res.status(200).json({
            statusCode: 200,
            message: `Protocol ${protocol.isPublished ? 'published' : 'unpublished'} successfully`,
            payload: protocol
        });
    } catch (err) {
        return res.status(err.status || 500).json({
            statusCode: err.status || 500,
            message: err.message || 'Failed to toggle publish status'
        });
    }
};
