import { Request, Response } from 'express';
import User from '../models/User';
import Admin from '../models/Admin';
import Wallet from '../models/Wallet';
import Session from '../models/Session';
import { generateToken as generateJWT } from '../utils/jwt';
import { generateToken, sendPasswordResetEmail } from '../utils/emailHelpers';
import { verifyTelegramInitData } from '../utils/telegramAuth';
import { notifyUser } from '../utils/telegramNotify';

// Register a new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, username } = req.body;

    // Validation - all fields required
    if (!email || !password || !username) {
      res.status(400).json({
        success: false,
        message: 'Email, password, and username are required',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
      return;
    }

    if (username.trim().length < 3) {
      res.status(400).json({
        success: false,
        message: 'Username must be at least 3 characters',
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
      return;
    }

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      password,
      username: username.trim(),
    });

    // Create wallet for new user
    await Wallet.create({
      user: user._id,
      balance: 0,
    });

    // Generate unique session token
    const sessionToken = generateToken();
    
    // Update user's session token
    user.sessionToken = sessionToken;
    await user.save();
    
    // Create new session with device info
    const deviceInfo = {
      userAgent: req.headers['user-agent'] || undefined,
      ipAddress: req.ip || req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || undefined,
    };
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration
    
    await Session.create({
      userId: user._id,
      userType: 'user',
      sessionToken,
      deviceInfo,
      expiresAt,
    });

    // Generate JWT token with session token
    const token = generateJWT({
      id: user._id.toString(),
      email: user.email,
      role: 'user',
      sessionToken,
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
          role: 'user' as const,
          authProvider: user.authProvider,
          telegramId: user.telegramId,
          telegramUsername: user.telegramUsername,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
      },
      message: 'Registration successful.',
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed. Please try again.',
    });
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
      return;
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Generate unique session token
    const sessionToken = generateToken();
    
    // Invalidate all existing sessions for this user
    await Session.deleteMany({ userId: user._id, userType: 'user' });
    
    // Update user's session token
    user.sessionToken = sessionToken;
    await user.save();
    
    // Create new session with device info
    const deviceInfo = {
      userAgent: req.headers['user-agent'] || undefined,
      ipAddress: req.ip || req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || undefined,
    };
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration
    
    await Session.create({
      userId: user._id,
      userType: 'user',
      sessionToken,
      deviceInfo,
      expiresAt,
    });

    // Generate JWT token with session token
    const token = generateJWT({
      id: user._id.toString(),
      email: user.email,
      role: 'user',
      sessionToken,
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
          role: 'user' as const,
          authProvider: user.authProvider,
          telegramId: user.telegramId,
          telegramUsername: user.telegramUsername,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed. Please try again.',
    });
  }
};

// Login user via Telegram Mini App
export const telegramMiniAppLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { initData } = req.body;
    const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    const maxAgeSeconds = Number(process.env.TELEGRAM_AUTH_MAX_AGE_SECONDS || 24 * 60 * 60);

    if (!initData || typeof initData !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Telegram initData is required',
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
    const telegramUser = verification.user;
    const telegramId = String(telegramUser.id);
    const fallbackEmail = `telegram_${telegramId}@telegram.local`;
    const fallbackUsername =
      telegramUser.username ||
      [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' ').trim() ||
      `tg_${telegramId}`;

    let user = await User.findOne({ telegramId });

    if (!user) {
      user = await User.findOne({ email: fallbackEmail });
    }

    if (!user) {
      user = await User.create({
        email: fallbackEmail,
        username: fallbackUsername,
        role: 'user',
        authProvider: 'telegram',
        telegramId,
        telegramUsername: telegramUser.username,
        telegramFirstName: telegramUser.first_name,
        telegramLastName: telegramUser.last_name,
        isEmailVerified: true,
      });

      await Wallet.create({
        user: user._id,
        balance: 0,
      });
    } else {
      user.authProvider = 'telegram';
      user.telegramId = telegramId;
      user.telegramUsername = telegramUser.username;
      user.telegramFirstName = telegramUser.first_name;
      user.telegramLastName = telegramUser.last_name;
      user.isEmailVerified = true;
      if (!user.username) {
        user.username = fallbackUsername;
      }
      await user.save();
    }

    const sessionToken = generateToken();

    await Session.deleteMany({ userId: user._id, userType: 'user' });

    user.sessionToken = sessionToken;
    await user.save();

    const deviceInfo = {
      userAgent: req.headers['user-agent'] || undefined,
      ipAddress: req.ip || req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || undefined,
    };

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await Session.create({
      userId: user._id,
      userType: 'user',
      sessionToken,
      deviceInfo,
      expiresAt,
    });

    const token = generateJWT({
      id: user._id.toString(),
      email: user.email,
      role: 'user',
      sessionToken,
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
          role: 'user' as const,
          authProvider: user.authProvider,
          telegramId: user.telegramId,
          telegramUsername: user.telegramUsername,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
      },
    });
  } catch (error: any) {
    console.error('Telegram mini app login error:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Telegram authentication failed',
    });
  }
};

// Login admin
export const loginAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
      return;
    }

    // Find admin and include password for comparison
    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!admin) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Generate unique session token
    const sessionToken = generateToken();
    
    // Invalidate all existing sessions for this admin
    await Session.deleteMany({ userId: admin._id, userType: 'admin' });
    
    // Update admin's session token
    admin.sessionToken = sessionToken;
    await admin.save();
    
    // Create new session with device info
    const deviceInfo = {
      userAgent: req.headers['user-agent'] || undefined,
      ipAddress: req.ip || req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || undefined,
    };
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration
    
    await Session.create({
      userId: admin._id,
      userType: 'admin',
      sessionToken,
      deviceInfo,
      expiresAt,
    });

    // Generate JWT token with session token
    const token = generateJWT({
      id: admin._id.toString(),
      email: admin.email,
      role: 'admin',
      sessionToken,
    });

    res.json({
      success: true,
      data: {
        user: {
          id: admin._id.toString(),
          email: admin.email,
          username: admin.username,
          role: 'admin' as const,
          createdAt: admin.createdAt,
          updatedAt: admin.updatedAt,
        },
        token,
      },
    });
  } catch (error: any) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed. Please try again.',
    });
  }
};

// Get current user (from token)
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // This will be populated by auth middleware
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    if (userRole === 'admin') {
      const admin = await Admin.findById(userId);
      if (!admin) {
        res.status(404).json({
          success: false,
          message: 'Admin not found',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id: admin._id.toString(),
          email: admin.email,
          username: admin.username,
          role: 'admin' as const,
          createdAt: admin.createdAt,
          updatedAt: admin.updatedAt,
        },
      });
    } else {
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
          role: 'user' as const,
          authProvider: user.authProvider,
          telegramId: user.telegramId,
          telegramUsername: user.telegramUsername,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    }
  } catch (error: any) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user information',
    });
  }
};


// Forgot password
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required',
      });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if user exists or not for security
      res.json({
        success: true,
        data: {
          message: 'If an account with that email exists, a password reset link has been sent',
        },
      });
      return;
    }

    // Generate reset token
    const resetToken = generateToken();
    const resetPasswordExpires = new Date();
    resetPasswordExpires.setHours(resetPasswordExpires.getHours() + 1); // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetPasswordExpires;
    await user.save();

    try {
      const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
      if (user.telegramId) {
        notifyUser(
          user.telegramId,
          `🔐 <b>Password reset</b>\n` +
            `Open this link to set a new password:\n` +
            `${resetUrl}\n\n` +
            `This link expires in 1 hour.`
        );
      }
      await sendPasswordResetEmail(user.email, resetToken);
    } catch (emailError) {
      console.error('Failed to send password reset notification:', emailError);
      res.status(500).json({
        success: false,
        message: 'Failed to send password reset notification',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        message: 'If an account with that email exists, a password reset link has been sent',
      },
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process password reset request',
    });
  }
};

// Logout user/admin
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    const sessionToken = (req as any).user?.sessionToken;

    if (!userId || !sessionToken) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    // Delete the session
    await Session.deleteOne({ sessionToken });

    // Clear session token from user/admin document
    if (userRole === 'admin') {
      await Admin.findByIdAndUpdate(userId, { $unset: { sessionToken: 1 } });
    } else {
      await User.findByIdAndUpdate(userId, { $unset: { sessionToken: 1 } });
    }

    res.json({
      success: true,
      data: {
        message: 'Logged out successfully',
      },
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Logout failed',
    });
  }
};

// Reset password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({
        success: false,
        message: 'Token and password are required',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
      return;
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
      return;
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      success: true,
      data: {
        message: 'Password reset successfully',
      },
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reset password',
    });
  }
};
