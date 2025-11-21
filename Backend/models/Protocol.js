import { DataTypes } from 'sequelize';
import { sequelize } from '../db/mysql.js';
import User from './User.js';

const Protocol = sequelize.define('Protocol', {
    title: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Protocol title'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Brief description of the protocol'
    },
    category: {
        type: DataTypes.ENUM('water-analysis', 'soil-analysis', 'plant-analysis', 'biological-fluids', 'general', 'other'),
        defaultValue: 'general',
        comment: 'Protocol category'
    },
    steps: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Structured steps array for better organization'
    },
    difficulty: {
        type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
        defaultValue: 'beginner',
        comment: 'Difficulty level'
    },
    isPublished: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether protocol is published and visible to users'
    },
    createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'email'
        },
        comment: 'Admin who created this protocol'
    },
    lastUpdatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Users',
            key: 'email'
        },
        comment: 'Admin who last updated this protocol'
    },
    viewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Number of times protocol has been viewed'
    },
}, {
    timestamps: true,
    paranoid: false,
    indexes: [
        {
            fields: ['category']
        },
        {
            fields: ['isPublished']
        },
        {
            fields: ['difficulty']
        }
    ]
});

// Define associations
Protocol.belongsTo(User, { foreignKey: 'createdBy', as: 'Creator' });
Protocol.belongsTo(User, { foreignKey: 'lastUpdatedBy', as: 'Updater' });

export default Protocol;
