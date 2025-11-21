import Protocol from '../models/Protocol.js';
import User from '../models/User.js';
import { Op } from 'sequelize';

/**
 * Create a new protocol (Admin only)
 */
export const createProtocol = async (adminId, protocolData) => {
    const protocol = await Protocol.create({
        ...protocolData,
        createdBy: adminId,
        lastUpdatedBy: adminId
    });

    // Return protocol with creator details
    const protocolWithDetails = await Protocol.findByPk(protocol.id, {
        include: [
            {
                model: User,
                as: 'Creator',
                attributes: ['id', 'firstName', 'lastName', 'email']
            }
        ]
    });

    return protocolWithDetails;
};

/**
 * Get all protocols
 * Admin can see all (including unpublished)
 * Regular users can only see published protocols
 */
export const getProtocols = async (isAdmin = false, filters = {}, page = 1, limit = 10) => {
    const { category, difficulty, search } = filters;

    const whereClause = {
        deletedAt: null
    };

    // Regular users can only see published protocols
    if (!isAdmin) {
        whereClause.isPublished = true;
    }

    // Filter by category
    if (category && category !== 'all') {
        whereClause.category = category;
    }

    // Filter by difficulty
    if (difficulty && difficulty !== 'all') {
        whereClause.difficulty = difficulty;
    }

    // Search in title and description (case-insensitive, trimmed)
    if (search && typeof search === 'string' && search.trim() !== '') {
        const trimmedSearch = search.trim();
        whereClause[Op.or] = [
            { title: { [Op.like]: `%${trimmedSearch}%` } },
            { description: { [Op.like]: `%${trimmedSearch}%` } }
        ];
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Protocol.findAndCountAll({
        where: whereClause,
        include: [
            {
                model: User,
                as: 'Creator',
                attributes: ['id', 'firstName', 'lastName', 'email']
            },
            {
                model: User,
                as: 'Updater',
                attributes: ['id', 'firstName', 'lastName', 'email'],
                required: false
            }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
    });

    return {
        protocols: rows,
        pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit)
        }
    };
};

/**
 * Get a single protocol by ID
 */
export const getProtocolById = async (protocolId, isAdmin = false) => {
    const whereClause = {
        id: protocolId,
        deletedAt: null
    };

    // Regular users can only see published protocols
    if (!isAdmin) {
        whereClause.isPublished = true;
    }

    const protocol = await Protocol.findOne({
        where: whereClause,
        include: [
            {
                model: User,
                as: 'Creator',
                attributes: ['id', 'firstName', 'lastName', 'email']
            },
            {
                model: User,
                as: 'Updater',
                attributes: ['id', 'firstName', 'lastName', 'email'],
                required: false
            }
        ]
    });

    if (!protocol) {
        const error = new Error('Protocol not found');
        error.status = 404;
        throw error;
    }

    // Increment view count
    await protocol.increment('viewCount');

    return protocol;
};

/**
 * Update a protocol (Admin only)
 */
export const updateProtocol = async (protocolId, adminId, updateData) => {
    const protocol = await Protocol.findOne({
        where: {
            id: protocolId,
            deletedAt: null
        }
    });

    if (!protocol) {
        const error = new Error('Protocol not found');
        error.status = 404;
        throw error;
    }

    await protocol.update({
        ...updateData,
        lastUpdatedBy: adminId
    });

    // Return updated protocol with details
    const updatedProtocol = await Protocol.findByPk(protocol.id, {
        include: [
            {
                model: User,
                as: 'Creator',
                attributes: ['id', 'firstName', 'lastName', 'email']
            },
            {
                model: User,
                as: 'Updater',
                attributes: ['id', 'firstName', 'lastName', 'email']
            }
        ]
    });

    return updatedProtocol;
};

/**
 * Delete a protocol (Admin only)
 */
export const deleteProtocol = async (protocolId) => {
    const protocol = await Protocol.findOne({
        where: {
            id: protocolId,
            deletedAt: null
        }
    });

    if (!protocol) {
        const error = new Error('Protocol not found');
        error.status = 404;
        throw error;
    }

    // Hard delete
    await protocol.destroy();

    return protocol;
};

/**
 * Toggle protocol publish status (Admin only)
 */
export const togglePublishStatus = async (protocolId) => {
    const protocol = await Protocol.findOne({
        where: {
            id: protocolId,
            deletedAt: null
        }
    });

    if (!protocol) {
        const error = new Error('Protocol not found');
        error.status = 404;
        throw error;
    }

    await protocol.update({ isPublished: !protocol.isPublished });

    return protocol;
};
