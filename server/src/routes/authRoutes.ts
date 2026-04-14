import express from 'express';
import {
  register,
  login,
  loginAdmin,
  telegramMiniAppLogin,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  logout,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/login-admin', loginAdmin);
router.post('/telegram-miniapp-login', telegramMiniAppLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.post('/logout', authenticate, logout);

export default router;
