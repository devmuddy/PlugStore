import { Request, Response } from 'express';
import User from '../models/User';
import Wallet from '../models/Wallet';
import Transaction from '../models/Transaction';
import Order from '../models/Order';
import Product from '../models/Product';
import Category from '../models/Category';
import Deposit from '../models/Deposit';
import PaymentMethod from '../models/PaymentMethod';
import { notifyUser } from '../utils/telegramNotify';
import { deleteImage } from '../config/cloudinary';

// Update user balance (admin only)
export const updateUserBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user?.id;
    const adminRole = (req as any).user?.role;

    if (!adminId || adminRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    const { userId } = req.params;
    const { amount, action } = req.body;

    // Validation
    if (!amount || parseFloat(amount) <= 0) {
      res.status(400).json({
        success: false,
        message: 'Please enter a valid amount',
      });
      return;
    }

    if (!['add', 'subtract'].includes(action)) {
      res.status(400).json({
        success: false,
        message: 'Action must be either "add" or "subtract"',
      });
      return;
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Find or create wallet
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      wallet = await Wallet.create({
        user: userId,
        balance: 0,
      });
    }

    // Store previous balance for notification
    const previousBalance = wallet.balance;

    // Calculate new balance
    const amountNum = parseFloat(amount);
    const newBalance = action === 'add'
      ? wallet.balance + amountNum
      : wallet.balance - amountNum;

    if (newBalance < 0) {
      res.status(400).json({
        success: false,
        message: 'Balance cannot be negative',
      });
      return;
    }

    // Update balance
    wallet.balance = newBalance;
    await wallet.save();

    // Create transaction record
    await Transaction.create({
      wallet: wallet._id,
      type: action === 'add' ? 'credit' : 'debit',
      amount: amountNum,
      description: `Admin ${action === 'add' ? 'added' : 'subtracted'} balance`,
    });

    if (user.telegramId) {
      const formatMoney = (value: number): string =>
        value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      notifyUser(
        user.telegramId,
        `<b>Balance update</b>\n` +
          `Action: ${action === 'add' ? 'Credit' : 'Debit'}\n` +
          `Amount: ${action === 'add' ? '+' : '-'}$${formatMoney(amountNum)}\n` +
          `Previous: $${formatMoney(previousBalance)}\n` +
          `New: $${formatMoney(newBalance)}`
      );
    }

    res.json({
      success: true,
      data: {
        balance: wallet.balance,
        message: `Balance ${action === 'add' ? 'added' : 'subtracted'} successfully`,
      },
    });
  } catch (error: any) {
    console.error('Update user balance error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update balance',
    });
  }
};

// Get dashboard statistics
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user?.id;
    const adminRole = (req as any).user?.role;

    if (!adminId || adminRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    // Get total users count
    const totalUsers = await User.countDocuments();

    // Get total orders count
    const totalOrders = await Order.countDocuments();

    // Get total revenue (sum of all completed orders)
    const revenueResult = await Order.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalPrice' }
        }
      }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Get pending orders count
    const pendingOrders = await Order.countDocuments({ status: 'pending' });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalOrders,
        totalRevenue,
        pendingOrders,
      },
    });
  } catch (error: any) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get dashboard stats',
    });
  }
};

// Get recent activity
export const getRecentActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user?.id;
    const adminRole = (req as any).user?.role;

    if (!adminId || adminRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 10;

    // Get recent orders
    const recentOrders = await Order.find()
      .populate('product', 'name')
      .populate('user', 'email username')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Get recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('email username createdAt')
      .lean();

    // Get recent products
    const recentProducts = await Product.find()
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name category stock updatedAt')
      .lean();

    // Format activities
    const activities: any[] = [];

    // Add order activities
    recentOrders.forEach((order: any) => {
      const timeAgo = getTimeAgo(order.createdAt);
      activities.push({
        id: order._id.toString(),
        type: 'order',
        message: `New order #${order._id.toString().slice(-6)} received`,
        time: timeAgo,
        createdAt: order.createdAt,
      });
    });

    // Add user activities
    recentUsers.forEach((user: any) => {
      const timeAgo = getTimeAgo(user.createdAt);
      activities.push({
        id: user._id.toString(),
        type: 'user',
        message: 'New user registered',
        time: timeAgo,
        createdAt: user.createdAt,
      });
    });

    // Add product activities
    recentProducts.forEach((product: any) => {
      if (product.updatedAt) {
        const timeAgo = getTimeAgo(product.updatedAt);
        activities.push({
          id: product._id.toString(),
          type: 'product',
          message: 'Product stock updated',
          time: timeAgo,
          createdAt: product.updatedAt,
        });
      }
    });

    // Sort by date and limit
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const limitedActivities = activities.slice(0, limit);

    res.json({
      success: true,
      data: limitedActivities,
    });
  } catch (error: any) {
    console.error('Get recent activity error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get recent activity',
    });
  }
};

// Get recent orders
export const getRecentOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user?.id;
    const adminRole = (req as any).user?.role;

    if (!adminId || adminRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 10;

    // Get recent orders with populated data
    const orders = await Order.find()
      .populate('user', 'email username')
      .populate({
        path: 'product',
        select: 'name',
        populate: {
          path: 'category',
          select: 'name',
        },
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Format orders for frontend
    const formattedOrders = orders.map((order: any) => ({
      id: order._id.toString(),
      orderId: `#${order._id.toString().slice(-6)}`,
      product: order.product?.name || 'Unknown Product',
      customer: order.user?.email || 'Unknown Customer',
      amount: order.totalPrice,
      status: order.status,
      createdAt: order.createdAt,
    }));

    res.json({
      success: true,
      data: formattedOrders,
    });
  } catch (error: any) {
    console.error('Get recent orders error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get recent orders',
    });
  }
};

// Get all users with their wallet balances
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user?.id;
    const adminRole = (req as any).user?.role;

    if (!adminId || adminRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    // Get all users
    const users = await User.find()
      .select('-password -emailVerificationToken -emailVerificationExpires -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 })
      .lean();

    // Get all wallets
    const wallets = await Wallet.find()
      .populate('user', 'email username')
      .lean();

    // Create a map of userId to balance
    const balanceMap = new Map();
    wallets.forEach((wallet: any) => {
      if (wallet.user && wallet.user._id) {
        balanceMap.set(wallet.user._id.toString(), wallet.balance);
      }
    });

    // Combine users with their balances
    const usersWithBalance = users.map((user: any) => ({
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      balance: balanceMap.get(user._id.toString()) || 0,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    res.json({
      success: true,
      data: usersWithBalance,
    });
  } catch (error: any) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get users',
    });
  }
};

// Delete a user
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user?.id;
    const adminRole = (req as any).user?.role;

    if (!adminId || adminRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (userId === adminId) {
      res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
      });
      return;
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Delete user's wallet and transactions
    const wallet = await Wallet.findOne({ user: userId });
    if (wallet) {
      // Delete all transactions for this wallet
      await Transaction.deleteMany({ wallet: wallet._id });
      // Delete the wallet
      await Wallet.findByIdAndDelete(wallet._id);
    }

    // Delete user's orders
    await Order.deleteMany({ user: userId });

    // Delete user's deposits
    await Deposit.deleteMany({ user: userId });

    // Finally, delete the user
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete user',
    });
  }
};

// Get all pending deposits
export const getPendingDeposits = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user?.id;
    const adminRole = (req as any).user?.role;

    if (!adminId || adminRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    // Get all pending deposits with user info
    const deposits = await Deposit.find({ status: 'pending' })
      .populate('user', 'email username')
      .sort({ createdAt: -1 })
      .lean();

    // Format deposits for frontend
    const formattedDeposits = deposits.map((deposit: any) => ({
      id: deposit._id.toString(),
      userId: deposit.user._id.toString(),
      userEmail: deposit.user.email,
      username: deposit.user.username,
      amount: deposit.amount,
      currency: deposit.paymentMethod || 'USD',
      transactionHash: deposit.transactionId || '',
      status: deposit.status,
      createdAt: deposit.createdAt,
    }));

    res.json({
      success: true,
      data: formattedDeposits,
    });
  } catch (error: any) {
    console.error('Get pending deposits error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get pending deposits',
    });
  }
};

// Approve a deposit
export const approveDeposit = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user?.id;
    const adminRole = (req as any).user?.role;

    if (!adminId || adminRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    const { depositId } = req.params;

    // Find deposit
    const deposit = await Deposit.findById(depositId).populate('user');
    if (!deposit) {
      res.status(404).json({
        success: false,
        message: 'Deposit not found',
      });
      return;
    }

    if (deposit.status !== 'pending') {
      res.status(400).json({
        success: false,
        message: 'Deposit has already been processed',
      });
      return;
    }

    // Find or create wallet
    let wallet = await Wallet.findOne({ user: deposit.user });
    if (!wallet) {
      wallet = await Wallet.create({
        user: deposit.user,
        balance: 0,
      });
    }

    // Credit user balance
    wallet.balance += deposit.amount;
    await wallet.save();

    // Update deposit status (no need to create separate transaction - deposit itself is the transaction)
    deposit.status = 'approved';
    deposit.processedBy = adminId as any;
    deposit.processedAt = new Date();
    await deposit.save();

    // Notify user via Telegram (non-blocking)
    const depositUser = deposit.user as any;
    if (depositUser?.telegramId) {
      notifyUser(
        depositUser.telegramId,
        `✅ <b>Deposit Approved</b>\n` +
        `💵 Amount: ${deposit.paymentMethod} ${deposit.amount}\n` +
        `💰 New Balance: $${wallet.balance.toFixed(2)}`
      );
    }

    res.json({
      success: true,
      message: 'Deposit approved and balance credited successfully',
      data: {
        depositId: deposit._id.toString(),
        newBalance: wallet.balance,
      },
    });
  } catch (error: any) {
    console.error('Approve deposit error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to approve deposit',
    });
  }
};

// Reject a deposit
export const rejectDeposit = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user?.id;
    const adminRole = (req as any).user?.role;

    if (!adminId || adminRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    const { depositId } = req.params;

    // Find deposit
    const deposit = await Deposit.findById(depositId);
    if (!deposit) {
      res.status(404).json({
        success: false,
        message: 'Deposit not found',
      });
      return;
    }

    if (deposit.status !== 'pending') {
      res.status(400).json({
        success: false,
        message: 'Deposit has already been processed',
      });
      return;
    }

    // Update deposit status (don't create transaction)
    deposit.status = 'rejected';
    deposit.processedBy = adminId as any;
    deposit.processedAt = new Date();
    await deposit.save();

    // Notify user via Telegram (non-blocking)
    const rejectedUser = await User.findById(deposit.user).select('telegramId').lean();
    if (rejectedUser?.telegramId) {
      notifyUser(
        rejectedUser.telegramId,
        `❌ <b>Deposit Rejected</b>\n` +
        `💵 Amount: ${deposit.paymentMethod} ${deposit.amount}\n` +
        `If you have questions, please contact support.`
      );
    }

    res.json({
      success: true,
      message: 'Deposit rejected successfully',
    });
  } catch (error: any) {
    console.error('Reject deposit error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reject deposit',
    });
  }
};

// Get all payment methods
export const getAllPaymentMethods = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user?.id;
    const adminRole = (req as any).user?.role;

    if (!adminId || adminRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    const paymentMethods = await PaymentMethod.find()
      .sort({ createdAt: -1 })
      .lean();

    const formattedMethods = paymentMethods.map((method: any) => ({
      id: method._id.toString(),
      name: method.name,
      symbol: method.symbol,
      walletAddress: method.walletAddress,
      icon: method.icon,
      qrCode: method.qrCode,
      minDeposit: method.minDeposit,
      maxDeposit: method.maxDeposit,
      isActive: method.isActive,
      createdAt: method.createdAt,
    }));

    res.json({
      success: true,
      data: formattedMethods,
    });
  } catch (error: any) {
    console.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get payment methods',
    });
  }
};

// Create payment method
export const createPaymentMethod = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user?.id;
    const adminRole = (req as any).user?.role;

    if (!adminId || adminRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    const { name, symbol, walletAddress, minDeposit, maxDeposit } = req.body;

    // Validation
    if (!name || !symbol || !walletAddress) {
      res.status(400).json({
        success: false,
        message: 'Name, symbol, and wallet address are required',
      });
      return;
    }

    // Check if symbol already exists
    const existingMethod = await PaymentMethod.findOne({ symbol: symbol.toUpperCase() });
    if (existingMethod) {
      res.status(400).json({
        success: false,
        message: 'Payment method with this symbol already exists',
      });
      return;
    }

    // Upload icon if provided
    let iconUrl: string | undefined;
    let iconPublicId: string | undefined;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    
    if (files && files.icon && files.icon.length > 0) {
      const iconFile = files.icon[0];
      // Only use uploaded image if upload was successful
      if (!(iconFile as any).uploadFailed && (iconFile as any).url) {
        iconUrl = (iconFile as any).url;
        iconPublicId = (iconFile as any).publicId;
      } else {
        console.warn('Icon upload failed, continuing without icon:', (iconFile as any).uploadError);
      }
    }

    // Upload QR code if provided
    let qrCodeUrl: string | undefined;
    let qrCodePublicId: string | undefined;
    if (files && files.qrCode && files.qrCode.length > 0) {
      const qrFile = files.qrCode[0];
      // Only use uploaded image if upload was successful
      if (!(qrFile as any).uploadFailed && (qrFile as any).url) {
        qrCodeUrl = (qrFile as any).url;
        qrCodePublicId = (qrFile as any).publicId;
      } else {
        console.warn('QR code upload failed, continuing without QR code:', (qrFile as any).uploadError);
      }
    }

    // Check if any image uploads failed
    let warningMessage = '';
    if (files) {
      const failedUploads: string[] = [];
      const errorMessages: string[] = [];
      
      if (files.icon && files.icon.length > 0 && (files.icon[0] as any).uploadFailed) {
        failedUploads.push('icon');
        const errorMsg = (files.icon[0] as any).uploadError;
        if (errorMsg && !errorMessages.includes(errorMsg)) {
          errorMessages.push(errorMsg);
        }
      }
      if (files.qrCode && files.qrCode.length > 0 && (files.qrCode[0] as any).uploadFailed) {
        failedUploads.push('QR code');
        const errorMsg = (files.qrCode[0] as any).uploadError;
        if (errorMsg && !errorMessages.includes(errorMsg)) {
          errorMessages.push(errorMsg);
        }
      }
      
      if (failedUploads.length > 0) {
        const errorDetail = errorMessages.length > 0 
          ? ` Error: ${errorMessages[0]}` 
          : '';
        warningMessage = `Payment method created successfully, but ${failedUploads.join(' and ')} upload failed.${errorDetail} Please check your Cloudinary configuration and internet connection.`;
      }
    }

    // Create payment method
    const paymentMethod = await PaymentMethod.create({
      name: name.trim(),
      symbol: symbol.toUpperCase().trim(),
      walletAddress: walletAddress.trim(),
      icon: iconUrl,
      iconPublicId: iconPublicId,
      qrCode: qrCodeUrl,
      qrCodePublicId: qrCodePublicId,
      minDeposit: minDeposit ? parseFloat(minDeposit) : undefined,
      maxDeposit: maxDeposit ? parseFloat(maxDeposit) : undefined,
      isActive: true,
    });

    res.json({
      success: true,
      data: {
        id: paymentMethod._id.toString(),
        name: paymentMethod.name,
        symbol: paymentMethod.symbol,
        walletAddress: paymentMethod.walletAddress,
        icon: paymentMethod.icon,
        qrCode: paymentMethod.qrCode,
        minDeposit: paymentMethod.minDeposit,
        maxDeposit: paymentMethod.maxDeposit,
        isActive: paymentMethod.isActive,
        createdAt: paymentMethod.createdAt,
      },
      message: warningMessage || 'Payment method created successfully',
      warning: warningMessage || undefined,
    });
  } catch (error: any) {
    console.error('Create payment method error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment method',
    });
  }
};

// Update payment method
export const updatePaymentMethod = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user?.id;
    const adminRole = (req as any).user?.role;

    if (!adminId || adminRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    const { id } = req.params;
    const { name, symbol, walletAddress, minDeposit, maxDeposit, isActive } = req.body;

    // Find payment method
    const paymentMethod = await PaymentMethod.findById(id);
    if (!paymentMethod) {
      res.status(404).json({
        success: false,
        message: 'Payment method not found',
      });
      return;
    }

    // Check if symbol is being changed and if new symbol already exists
    if (symbol && symbol.toUpperCase() !== paymentMethod.symbol) {
      const existingMethod = await PaymentMethod.findOne({ 
        symbol: symbol.toUpperCase(),
        _id: { $ne: id }
      });
      if (existingMethod) {
        res.status(400).json({
          success: false,
          message: 'Payment method with this symbol already exists',
        });
        return;
      }
    }

    // Upload new icon if provided
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    
    if (files && files.icon && files.icon.length > 0) {
      const iconFile = files.icon[0];
      // Only update if upload was successful
      if (!(iconFile as any).uploadFailed && (iconFile as any).url) {
        // Delete old icon if exists
        if (paymentMethod.iconPublicId) {
          try {
            await deleteImage(paymentMethod.iconPublicId);
          } catch (error) {
            console.error('Failed to delete old icon:', error);
          }
        }
        paymentMethod.icon = (iconFile as any).url;
        paymentMethod.iconPublicId = (iconFile as any).publicId;
      } else {
        console.warn('Icon upload failed, keeping existing icon:', (iconFile as any).uploadError);
      }
    }

    // Upload new QR code if provided
    if (files && files.qrCode && files.qrCode.length > 0) {
      const qrFile = files.qrCode[0];
      // Only update if upload was successful
      if (!(qrFile as any).uploadFailed && (qrFile as any).url) {
        // Delete old QR code if exists
        if (paymentMethod.qrCodePublicId) {
          try {
            await deleteImage(paymentMethod.qrCodePublicId);
          } catch (error) {
            console.error('Failed to delete old QR code:', error);
          }
        }
        paymentMethod.qrCode = (qrFile as any).url;
        paymentMethod.qrCodePublicId = (qrFile as any).publicId;
      } else {
        console.warn('QR code upload failed, keeping existing QR code:', (qrFile as any).uploadError);
      }
    }

    // Check if any image uploads failed
    let warningMessage = '';
    if (files) {
      const failedUploads: string[] = [];
      const errorMessages: string[] = [];
      
      if (files.icon && files.icon.length > 0 && (files.icon[0] as any).uploadFailed) {
        failedUploads.push('icon');
        const errorMsg = (files.icon[0] as any).uploadError;
        if (errorMsg && !errorMessages.includes(errorMsg)) {
          errorMessages.push(errorMsg);
        }
      }
      if (files.qrCode && files.qrCode.length > 0 && (files.qrCode[0] as any).uploadFailed) {
        failedUploads.push('QR code');
        const errorMsg = (files.qrCode[0] as any).uploadError;
        if (errorMsg && !errorMessages.includes(errorMsg)) {
          errorMessages.push(errorMsg);
        }
      }
      
      if (failedUploads.length > 0) {
        const errorDetail = errorMessages.length > 0 
          ? ` Error: ${errorMessages[0]}` 
          : '';
        warningMessage = `Payment method updated successfully, but ${failedUploads.join(' and ')} upload failed.${errorDetail} Existing images were kept.`;
      }
    }

    // Update fields
    if (name) paymentMethod.name = name.trim();
    if (symbol) paymentMethod.symbol = symbol.toUpperCase().trim();
    if (walletAddress) paymentMethod.walletAddress = walletAddress.trim();
    if (minDeposit !== undefined) paymentMethod.minDeposit = minDeposit ? parseFloat(minDeposit) : undefined;
    if (maxDeposit !== undefined) paymentMethod.maxDeposit = maxDeposit ? parseFloat(maxDeposit) : undefined;
    if (isActive !== undefined) paymentMethod.isActive = isActive === 'true' || isActive === true;

    await paymentMethod.save();

    res.json({
      success: true,
      data: {
        id: paymentMethod._id.toString(),
        name: paymentMethod.name,
        symbol: paymentMethod.symbol,
        walletAddress: paymentMethod.walletAddress,
        icon: paymentMethod.icon,
        qrCode: paymentMethod.qrCode,
        minDeposit: paymentMethod.minDeposit,
        maxDeposit: paymentMethod.maxDeposit,
        isActive: paymentMethod.isActive,
        createdAt: paymentMethod.createdAt,
      },
      message: warningMessage || 'Payment method updated successfully',
      warning: warningMessage || undefined,
    });
  } catch (error: any) {
    console.error('Update payment method error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update payment method',
    });
  }
};

// Delete payment method
export const deletePaymentMethod = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user?.id;
    const adminRole = (req as any).user?.role;

    if (!adminId || adminRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    const { id } = req.params;

    // Find payment method
    const paymentMethod = await PaymentMethod.findById(id);
    if (!paymentMethod) {
      res.status(404).json({
        success: false,
        message: 'Payment method not found',
      });
      return;
    }

    // Delete images from Cloudinary
    if (paymentMethod.iconPublicId) {
      try {
        await deleteImage(paymentMethod.iconPublicId);
      } catch (error) {
        console.error('Failed to delete icon from Cloudinary:', error);
      }
    }

    if (paymentMethod.qrCodePublicId) {
      try {
        await deleteImage(paymentMethod.qrCodePublicId);
      } catch (error) {
        console.error('Failed to delete QR code from Cloudinary:', error);
      }
    }

    // Delete payment method
    await PaymentMethod.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Payment method deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete payment method error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete payment method',
    });
  }
};

// Get all orders (admin)
export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user?.id;
    const adminRole = (req as any).user?.role;

    if (!adminId || adminRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    const { status, search, limit, page } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 50;
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    // Apply search if provided - search by order ID (last 6 chars)
    if (search) {
      const searchStr = (search as string).trim();
      // Try to match order ID (last 6 characters)
      if (searchStr.length <= 6) {
        // Search in MongoDB ObjectId
        const ordersForSearch = await Order.find(query)
          .populate('user', 'email username')
          .populate({
            path: 'product',
            select: 'name category subCategory',
            populate: {
              path: 'category',
              select: 'name',
            },
          })
          .sort({ createdAt: -1 })
          .lean();
        
        // Filter by search term in order number, user email, username, or product name
        const searchLower = searchStr.toLowerCase();
        const filtered = ordersForSearch.filter((order: any) => {
          const orderNum = order._id.toString().slice(-6).toLowerCase();
          const userEmail = (order.user as any)?.email?.toLowerCase() || '';
          const username = (order.user as any)?.username?.toLowerCase() || '';
          const productName = (order.product as any)?.name?.toLowerCase() || '';
          return (
            orderNum.includes(searchLower) ||
            userEmail.includes(searchLower) ||
            username.includes(searchLower) ||
            productName.includes(searchLower)
          );
        });
        
        const orders = filtered.slice(skip, skip + limitNum);
        const total = filtered.length;
        
        // Format orders
        const formattedOrders = orders.map((order: any) => ({
          id: order._id.toString(),
          orderNumber: `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
          userId: order.user?._id?.toString() || '',
          username: order.user?.username || 'Unknown',
          userEmail: order.user?.email || 'Unknown',
          productName: order.product?.name || 'Unknown Product',
          category: order.product?.category?.name || 'Uncategorized',
          subCategory: order.product?.subCategory || undefined,
          amount: order.totalPrice,
          status: order.status,
          quantity: order.quantity,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          completedAt: order.status === 'completed' ? order.updatedAt : undefined,
        }));

        res.json({
          success: true,
          data: {
            orders: formattedOrders,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
          },
        });
        return;
      }
    }

    // Get orders with populated data (no search or search didn't match)
    const orders = await Order.find(query)
      .populate('user', 'email username')
      .populate({
        path: 'product',
        select: 'name category subCategory',
        populate: {
          path: 'category',
          select: 'name',
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();
    const total = await Order.countDocuments(query);

    // Format orders for frontend
    const formattedOrders = orders.map((order: any) => ({
      id: order._id.toString(),
      orderNumber: `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
      userId: order.user?._id?.toString() || '',
      username: order.user?.username || 'Unknown',
      userEmail: order.user?.email || 'Unknown',
      productName: order.product?.name || 'Unknown Product',
      category: order.product?.category?.name || 'Uncategorized',
      subCategory: order.product?.subCategory || undefined,
      amount: order.totalPrice,
      status: order.status,
      quantity: order.quantity,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      completedAt: order.status === 'completed' ? order.updatedAt : undefined,
    }));

    res.json({
      success: true,
      data: {
        orders: formattedOrders,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get orders',
    });
  }
};

// Get single order by ID (admin)
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user?.id;
    const adminRole = (req as any).user?.role;

    if (!adminId || adminRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    const { id } = req.params;

    const order = await Order.findById(id)
      .populate('user', 'email username')
      .populate({
        path: 'product',
        select: 'name category description price',
        populate: {
          path: 'category',
          select: 'name',
        },
      })
      .lean();

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found',
      });
      return;
    }

    const formattedOrder = {
      id: order._id.toString(),
      orderNumber: `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
      userId: (order.user as any)?._id?.toString() || '',
      username: (order.user as any)?.username || 'Unknown',
      userEmail: (order.user as any)?.email || 'Unknown',
      productName: (order.product as any)?.name || 'Unknown Product',
      category: (order.product as any)?.category?.name || 'Uncategorized',
      amount: order.totalPrice,
      status: order.status,
      quantity: order.quantity,
      deliveryInfo: order.deliveryInfo,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };

    res.json({
      success: true,
      data: formattedOrder,
    });
  } catch (error: any) {
    console.error('Get order by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get order',
    });
  }
};

// Update order status (admin)
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user?.id;
    const adminRole = (req as any).user?.role;

    if (!adminId || adminRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['pending', 'processing', 'completed', 'cancelled'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: pending, processing, completed, cancelled',
      });
      return;
    }

    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found',
      });
      return;
    }

    // Update status
    order.status = status;
    await order.save();

    // Emit socket event for real-time update
    const io = (req as any).app.get('io');
    if (io) {
      io.to(`user-${order.user}`).emit('order:update', {
        orderId: order._id.toString(),
        status: order.status,
      });
      io.to('admin-room').emit('order:update', {
        orderId: order._id.toString(),
        status: order.status,
      });
    }

    res.json({
      success: true,
      data: {
        id: order._id.toString(),
        status: order.status,
        updatedAt: order.updatedAt,
      },
      message: 'Order status updated successfully',
    });
  } catch (error: any) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update order status',
    });
  }
};

// ==================== CATEGORY MANAGEMENT ====================

// Get all categories with subcategories
export const getAllCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user?.id;
    const adminRole = (req as any).user?.role;

    if (!adminId || adminRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    const categories = await Category.find().sort({ createdAt: 1 }).lean();

    const formattedCategories = categories.map((category: any) => {
      // Sort subcategories by creation date (oldest first)
      const sortedSubCategories = [...category.subCategories].sort((a: any, b: any) => {
        // Since subcategories don't have timestamps, we'll sort by _id which is roughly chronological
        return a._id.toString().localeCompare(b._id.toString());
      });

      return {
        id: category._id.toString(),
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
        isActive: category.isActive,
        subCategories: sortedSubCategories.map((sub: any) => ({
          id: sub._id.toString(),
          name: sub.name,
          slug: sub.slug,
          categoryId: category._id.toString(),
          isActive: sub.isActive,
        })),
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      };
    });

    res.json({
      success: true,
      data: formattedCategories,
    });
  } catch (error: any) {
    console.error('Get all categories error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get categories',
    });
  }
};

// Create category
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user?.id;
    const adminRole = (req as any).user?.role;

    if (!adminId || adminRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    const { name, description, icon } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({
        success: false,
        message: 'Category name is required',
      });
      return;
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ 
      $or: [
        { name: name.trim() },
        { slug: name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '') }
      ]
    });
    if (existingCategory) {
      res.status(400).json({
        success: false,
        message: 'Category with this name already exists',
      });
      return;
    }

    const category = await Category.create({
      name: name.trim(),
      description: description?.trim(),
      icon: icon,
      subCategories: [],
    });

    res.json({
      success: true,
      data: {
        id: category._id.toString(),
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
        isActive: category.isActive,
        subCategories: [],
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
      message: 'Category created successfully',
    });
  } catch (error: any) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create category',
    });
  }
};

// Update category
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user?.id;
    const adminRole = (req as any).user?.role;

    if (!adminId || adminRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    const { id } = req.params;
    const { name, description, icon, isActive } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found',
      });
      return;
    }

    // Check if new name conflicts with existing category
    if (name && name.trim() !== category.name) {
      const existingCategory = await Category.findOne({
        _id: { $ne: id },
        $or: [
          { name: name.trim() },
          { slug: name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '') }
        ]
      });
      if (existingCategory) {
        res.status(400).json({
          success: false,
          message: 'Category with this name already exists',
        });
        return;
      }
      category.name = name.trim();
    }

    if (description !== undefined) category.description = description?.trim();
    if (icon !== undefined) category.icon = icon;
    if (isActive !== undefined) category.isActive = isActive === 'true' || isActive === true;

    await category.save();

    const formattedCategory = {
      id: category._id.toString(),
      name: category.name,
      slug: category.slug,
      description: category.description,
      icon: category.icon,
      isActive: category.isActive,
      subCategories: category.subCategories.map((sub: any) => ({
        id: sub._id.toString(),
        name: sub.name,
        slug: sub.slug,
        categoryId: category._id.toString(),
        isActive: sub.isActive,
      })),
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };

    res.json({
      success: true,
      data: formattedCategory,
      message: 'Category updated successfully',
    });
  } catch (error: any) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update category',
    });
  }
};

// Delete category
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user?.id;
    const adminRole = (req as any).user?.role;

    if (!adminId || adminRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    const { id } = req.params;

    // Check if category has products
    const productsCount = await Product.countDocuments({ category: id });
    if (productsCount > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete category. ${productsCount} product(s) are using this category.`,
      });
      return;
    }

    await Category.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete category',
    });
  }
};

// ==================== SUB CATEGORY MANAGEMENT ====================

// Add subcategory to category
export const addSubCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user?.id;
    const adminRole = (req as any).user?.role;

    if (!adminId || adminRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({
        success: false,
        message: 'Subcategory name is required',
      });
      return;
    }

    const category = await Category.findById(id);
    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found',
      });
      return;
    }

    // Check if subcategory already exists in this category
    const subCategorySlug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
    const existingSub = category.subCategories.find((sub: any) => sub.slug === subCategorySlug);
    if (existingSub) {
      res.status(400).json({
        success: false,
        message: 'Subcategory with this name already exists in this category',
      });
      return;
    }

    // Add subcategory
    category.subCategories.push({
      name: name.trim(),
      slug: subCategorySlug,
      isActive: true,
    });

    await category.save();

    const newSubCategory = category.subCategories[category.subCategories.length - 1];
    const newSubCategoryId = newSubCategory?._id?.toString();
    if (!newSubCategoryId) {
      res.status(500).json({
        success: false,
        message: 'Failed to create subcategory',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: newSubCategoryId,
        name: newSubCategory.name,
        slug: newSubCategory.slug,
        categoryId: category._id.toString(),
        isActive: newSubCategory.isActive,
      },
      message: 'Subcategory added successfully',
    });
  } catch (error: any) {
    console.error('Add subcategory error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add subcategory',
    });
  }
};

// Update subcategory
export const updateSubCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user?.id;
    const adminRole = (req as any).user?.role;

    if (!adminId || adminRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    const { id, subCategoryId } = req.params;
    const { name, isActive } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found',
      });
      return;
    }

    const subCategory = (category.subCategories as any).id(subCategoryId);
    if (!subCategory) {
      res.status(404).json({
        success: false,
        message: 'Subcategory not found',
      });
      return;
    }

    // Check if new name conflicts
    if (name && name.trim() !== subCategory.name) {
      const newSlug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
      const existingSub = category.subCategories.find(
        (sub: any) => sub._id.toString() !== subCategoryId && sub.slug === newSlug
      );
      if (existingSub) {
        res.status(400).json({
          success: false,
          message: 'Subcategory with this name already exists in this category',
        });
        return;
      }
      subCategory.name = name.trim();
      subCategory.slug = newSlug;
    }

    if (isActive !== undefined) subCategory.isActive = isActive === 'true' || isActive === true;

    await category.save();

    res.json({
      success: true,
      data: {
        id: subCategory._id.toString(),
        name: subCategory.name,
        slug: subCategory.slug,
        categoryId: category._id.toString(),
        isActive: subCategory.isActive,
      },
      message: 'Subcategory updated successfully',
    });
  } catch (error: any) {
    console.error('Update subcategory error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update subcategory',
    });
  }
};

// Delete subcategory
export const deleteSubCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user?.id;
    const adminRole = (req as any).user?.role;

    if (!adminId || adminRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    const { id, subCategoryId } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found',
      });
      return;
    }

    const subCategory = (category.subCategories as any).id(subCategoryId);
    if (!subCategory) {
      res.status(404).json({
        success: false,
        message: 'Subcategory not found',
      });
      return;
    }

    // Check if subcategory has products
    const subCategorySlug = subCategory.slug;
    const productsCount = await Product.countDocuments({
      category: id,
      subCategory: subCategorySlug,
    });
    if (productsCount > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete subcategory. ${productsCount} product(s) are using this subcategory.`,
      });
      return;
    }

    (category.subCategories as any).pull(subCategoryId);
    await category.save();

    res.json({
      success: true,
      message: 'Subcategory deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete subcategory error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete subcategory',
    });
  }
};

// ==================== PRODUCT MANAGEMENT ====================

// Get all products
export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user?.id;
    const adminRole = (req as any).user?.role;

    if (!adminId || adminRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    const { categoryId, subCategoryId, search, isActive } = req.query;

    const query: any = {};
    if (categoryId) query.category = categoryId;
    if (subCategoryId) query.subCategory = subCategoryId;
    if (isActive !== undefined) query.isActive = String(isActive) === 'true';
    if (search) {
      query.$text = { $search: search as string };
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await Product.countDocuments(query);

    // Get all categories to map subcategory slugs to IDs
    const allCategories = await Category.find().lean();
    const subCategoryMap = new Map<string, string>();
    allCategories.forEach((cat: any) => {
      cat.subCategories.forEach((sub: any) => {
        subCategoryMap.set(sub.slug, sub._id.toString());
      });
    });

    const formattedProducts = products.map((product: any) => {
      // Find subcategory ID from slug
      let mappedSubCategoryId: string | undefined;
      if (product.subCategory) {
        mappedSubCategoryId = subCategoryMap.get(product.subCategory);
      }

      return {
        id: product._id.toString(),
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        balance: product.balance,
        categoryId: product.category._id.toString(),
        categoryName: product.category.name,
        subCategoryId: mappedSubCategoryId,
        subCategorySlug: product.subCategory,
        image: product.image,
        isActive: product.isActive,
        tags: product.tags || [],
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
    });

    res.json({
      success: true,
      data: {
        products: formattedProducts,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get all products error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get products',
    });
  }
};

// Get product by ID
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user?.id;
    const adminRole = (req as any).user?.role;

    if (!adminId || adminRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    const { id } = req.params;

    const product = await Product.findById(id).populate('category', 'name slug').lean();

    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Product not found',
      });
      return;
    }

    // Find subcategory ID from slug
    const category = await Category.findById((product.category as any)._id).lean();
    let subCategoryId: string | undefined;
    if (product.subCategory && category) {
      const subCat = (category as any).subCategories.find((sub: any) => sub.slug === product.subCategory);
      if (subCat) {
        subCategoryId = subCat._id.toString();
      }
    }

    const formattedProduct = {
      id: product._id.toString(),
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      balance: product.balance,
      categoryId: (product.category as any)._id.toString(),
      categoryName: (product.category as any).name,
      subCategoryId: subCategoryId,
      subCategorySlug: product.subCategory,
      image: product.image,
      isActive: product.isActive,
      tags: product.tags || [],
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    res.json({
      success: true,
      data: formattedProduct,
    });
  } catch (error: any) {
    console.error('Get product by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get product',
    });
  }
};

// Create product
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user?.id;
    const adminRole = (req as any).user?.role;

    if (!adminId || adminRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    const { name, description, price, balance, categoryId, subCategoryId, isActive, tags } = req.body;

    // Validation
    if (!name || !name.trim()) {
      res.status(400).json({
        success: false,
        message: 'Product name is required',
      });
      return;
    }
    if (!description || !description.trim()) {
      res.status(400).json({
        success: false,
        message: 'Product description is required',
      });
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      res.status(400).json({
        success: false,
        message: 'Valid product price is required',
      });
      return;
    }
    if (!categoryId) {
      res.status(400).json({
        success: false,
        message: 'Category is required',
      });
      return;
    }

    // Verify category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found',
      });
      return;
    }

    // Verify subcategory exists if provided
    let subCategorySlug: string | undefined;
    if (subCategoryId) {
      const subCategory = category.subCategories.find(
        (sub: any) => sub._id.toString() === subCategoryId || sub.slug === subCategoryId
      );
      if (!subCategory) {
        res.status(404).json({
          success: false,
          message: 'Subcategory not found',
        });
        return;
      }
      subCategorySlug = subCategory.slug;
    }

    // Create product (digital products don't need stock or images)
    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      stock: 0, // Digital products are always available
      balance: balance ? parseFloat(balance) : undefined,
      category: categoryId,
      subCategory: subCategorySlug,
      isActive: isActive === undefined ? true : isActive === 'true' || isActive === true,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim())) : [],
    });

    const populatedProduct = await Product.findById(product._id).populate('category', 'name slug').lean();
    
    // Find subcategory ID from slug (reuse the subCategoryId from req.body if it exists)
    let mappedSubCategoryId: string | undefined = subCategoryId; // Use the one from req.body if it was provided
    if (subCategorySlug && !mappedSubCategoryId) {
      const subCat = category.subCategories.find((sub: any) => sub.slug === subCategorySlug);
      if (subCat) {
        mappedSubCategoryId = subCat._id?.toString();
      }
    }

    res.json({
      success: true,
      data: {
        id: product._id.toString(),
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        balance: product.balance,
        categoryId: categoryId,
        categoryName: (populatedProduct as any).category.name,
        subCategoryId: mappedSubCategoryId,
        subCategorySlug: product.subCategory,
        image: product.image,
        isActive: product.isActive,
        tags: product.tags || [],
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      },
      message: 'Product created successfully',
    });
  } catch (error: any) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create product',
    });
  }
};

// Update product
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user?.id;
    const adminRole = (req as any).user?.role;

    if (!adminId || adminRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    const { id } = req.params;
    const { name, description, price, balance, categoryId, subCategoryId, isActive, tags } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Product not found',
      });
      return;
    }

    // Validate category if changed
    if (categoryId && categoryId !== product.category.toString()) {
      const category = await Category.findById(categoryId);
      if (!category) {
        res.status(404).json({
          success: false,
          message: 'Category not found',
        });
        return;
      }

      // Validate subcategory if provided
      if (subCategoryId) {
        const subCategory = category.subCategories.find(
          (sub: any) => sub._id.toString() === subCategoryId || sub.slug === subCategoryId
        );
        if (!subCategory) {
          res.status(404).json({
            success: false,
            message: 'Subcategory not found',
          });
          return;
        }
        product.subCategory = subCategory.slug;
      } else {
        product.subCategory = undefined;
      }

      product.category = categoryId as any;
    } else if (subCategoryId && categoryId === product.category.toString()) {
      // Update subcategory for same category
      const category = await Category.findById(product.category);
      if (category) {
        const subCategory = category.subCategories.find(
          (sub: any) => sub._id.toString() === subCategoryId || sub.slug === subCategoryId
        );
        if (!subCategory) {
          res.status(404).json({
            success: false,
            message: 'Subcategory not found',
          });
          return;
        }
        product.subCategory = subCategory.slug;
      }
    }

    // Upload new image if provided
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    if (files && files.image && files.image.length > 0) {
      const imageFile = files.image[0];
      if (!(imageFile as any).uploadFailed && (imageFile as any).url) {
        // Delete old image if exists
        if (product.imagePublicId) {
          try {
            await deleteImage(product.imagePublicId);
          } catch (error) {
            console.error('Failed to delete old product image:', error);
          }
        }
        product.image = (imageFile as any).url;
        product.imagePublicId = (imageFile as any).publicId;
      }
    }

    // Update fields (digital products don't need stock)
    if (name) product.name = name.trim();
    if (description) product.description = description.trim();
    if (price) product.price = parseFloat(price);
    if (balance !== undefined) product.balance = balance ? parseFloat(balance) : undefined;
    if (isActive !== undefined) product.isActive = isActive === 'true' || isActive === true;
    if (tags !== undefined) {
      product.tags = Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim());
    }

    await product.save();

    const populatedProduct = await Product.findById(product._id).populate('category', 'name slug').lean();

    res.json({
      success: true,
      data: {
        id: product._id.toString(),
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        balance: product.balance,
        categoryId: product.category.toString(),
        categoryName: (populatedProduct as any).category.name,
        subCategoryId: product.subCategory,
        image: product.image,
        isActive: product.isActive,
        tags: product.tags || [],
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      },
      message: 'Product updated successfully',
    });
  } catch (error: any) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update product',
    });
  }
};

// Delete product
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user?.id;
    const adminRole = (req as any).user?.role;

    if (!adminId || adminRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Product not found',
      });
      return;
    }

    // Check if product has orders
    const ordersCount = await Order.countDocuments({ product: id });
    if (ordersCount > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete product. ${ordersCount} order(s) are associated with this product.`,
      });
      return;
    }

    // Delete image from Cloudinary if exists
    if (product.imagePublicId) {
      try {
        await deleteImage(product.imagePublicId);
      } catch (error) {
        console.error('Failed to delete product image:', error);
      }
    }

    await Product.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete product',
    });
  }
};

// Helper function to calculate time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
}
