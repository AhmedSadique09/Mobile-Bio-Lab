import express from 'express';
import { getUsers,getUser,updateProfileByUser,deleteOwnAccount,activateUser} from '../controllers/userController.js';
import {verifyToken} from '../utils/verifyUser.js';

const router = express.Router();

router.put('/update/:userId', verifyToken, updateProfileByUser);
router.get('/getusers', verifyToken, getUsers);
router.get('/:userId', verifyToken, getUser);
router.delete('/delete/:userId', verifyToken, deleteOwnAccount);
router.get('/activate/:vuId', activateUser);


export default router;