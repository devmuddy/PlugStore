import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import Session from '../models/Session';
import User from '../models/User';
import Admin from '../models/Admin';
import { TelegramMiniAppUser, verifyTelegramInitData } from '../utils/telegramAuth';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      telegramUser?: TelegramMiniAppUser;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated. Please provide a valid token.',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Verify JWT token
      const decoded = verifyToken(token);
      
      // Validate session token exists in database
      const session = await Session.findOne({ 
        sessionToken: decoded.sessionToken,
        userId: decoded.id,
        userType: decoded.role,
        expiresAt: { $gt: new Date() }, // Check if session hasn't expired
      });

      if (!session) {
        res.status(401).json({
          success: false,
          message: 'Session expired or invalid. Please login again.',
        });
        return;
      }

      // Verify session token matches user's current session token
      if (decoded.role === 'admin') {
        const admin = await Admin.findById(decoded.id).select('+sessionToken');
        if (!admin || admin.sessionToken !== decoded.sessionToken) {
          res.status(401).json({
            success: false,
            message: 'Session invalidated. Please login again.',
          });
          return;
        }
      } else {
        const user = await User.findById(decoded.id).select('+sessionToken');
        if (!user || user.sessionToken !== decoded.sessionToken) {
          res.status(401).json({
            success: false,
            message: 'Session invalidated. Please login again.',
          });
          return;
        }
      }

      // Update last activity
      session.lastActivity = new Date();
      await session.save();

      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
      return;
    }
  } catch (error: any) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
    return;
  }
  next();
};

export const requireUser = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'user') {
    res.status(403).json({
      success: false,
      message: 'Access denied. User privileges required.',
    });
    return;
  }
  next();
};

export const requireTelegramMiniApp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'user') {
      res.status(403).json({
        success: false,
        message: 'Access denied. User privileges required.',
      });
      return;
    }

    const initDataHeader = req.headers['x-telegram-init-data'];
    const initData = Array.isArray(initDataHeader) ? initDataHeader[0] : initDataHeader;
    const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    const maxAgeSeconds = Number(process.env.TELEGRAM_AUTH_MAX_AGE_SECONDS || 24 * 60 * 60);

    if (!initData) {
      res.status(403).json({
        success: false,
        message: 'User dashboard is only accessible via Telegram Mini App.',
      });
      return;
    }

    if (!botToken) {
      res.status(500).json({
        success: false,
        message: 'Telegram bot token is not configured on server',
      });
      return;
    }

    const verification = verifyTelegramInitData(initData, botToken, maxAgeSeconds);
    const authUser = await User.findById(req.user.id).select('telegramId');

    if (!authUser?.telegramId || authUser.telegramId !== String(verification.user.id)) {
      res.status(401).json({
        success: false,
        message: 'Telegram identity does not match authenticated user.',
      });
      return;
    }

    req.telegramUser = verification.user;
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: error.message || 'Invalid Telegram Mini App authentication.',
    });
  }
};
