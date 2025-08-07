import express from 'express';
import { getUsers,getUser,updateProfileByUser} from '../controllers/userController.js';
import {verifyToken} from '../utils/verifyUser.js';

const router = express.Router();

router.put('/update/:userId', verifyToken, updateProfileByUser);
router.get('/getusers', verifyToken, getUsers);
router.get('/:userId', verifyToken, getUser);

export default router;