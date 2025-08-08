import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import { verifyAdmin } from '../utils/verifyAdmin.js';
import { updateUserByAdmin, deleteUserByAdmin, verifyUserByAdmin, sendActivationEmail, exportUsersToPDF } from '../controllers/adminController.js';

const router = express.Router();


router.get('/dashboard', verifyToken, verifyAdmin, (req, res) => {
  res.json({ message: 'Welcome Admin! You have full access.' });
});
router.put('/update-user/:userId', verifyToken, verifyAdmin, updateUserByAdmin);
router.delete('/delete-user/:userId', verifyAdmin, deleteUserByAdmin);
router.put('/verify/:userId', verifyAdmin, verifyUserByAdmin);
router.post('/send-activation/:userId', verifyAdmin, sendActivationEmail);
router.get('/export-users', verifyToken, verifyAdmin, exportUsersToPDF);

export default router;
