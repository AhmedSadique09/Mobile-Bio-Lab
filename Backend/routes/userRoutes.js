import express from 'express';
import { getUsers,getUser} from '../controllers/userController.js';
import {verifyToken} from '../utils/verifyUser.js';

const router = express.Router();


router.get('/getusers', verifyToken, getUsers);
router.get('/:userId', verifyToken, getUser);

export default router;