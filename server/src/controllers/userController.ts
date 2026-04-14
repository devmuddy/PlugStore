import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Wallet from '../models/Wallet';
import Deposit from '../models/Deposit';
import Order from '../models/Order';
import Product from '../models/Product';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import User from '../models/User';
import PaymentMethod from '../models/PaymentMethod';
import { sendOrderConfirmationEmail, sendDepositSubmissionEmail } from '../utils/emailHelpers';
import { notifyAdmin } from '../utils/telegramNotify';

// Get user balance
export const getBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    // Find or create wallet for user
    let wallet = await Wallet.findOne({ user: userId });

    if (!wallet) {
      // Create wallet if it doesn't exist
      wallet = await Wallet.create({
        user: userId,
        balance: 0,
      });
    }

    res.json({
      success: true,
      data: {
        balance: wallet.balance,
      },
    });
  } catch (error: any) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get balance',
    });
  }
};

// Get user transactions (combines deposits and orders)
export const getTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    // Find user's wallet
    const wallet = await Wallet.findOne({ user: userId });
    
    // Fetch deposits
    const deposits = await Deposit.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Fetch orders
    const orders = await Order.find({ user: userId })
      .populate('product', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Fetch wallet transactions (exclude transactions linked to deposits/orders to avoid duplicates)
    let walletTransactions: any[] = [];
    if (wallet) {
      walletTransactions = await Transaction.find({ 
        wallet: wallet._id,
        relatedDeposit: { $exists: false },
        relatedOrder: { $exists: false }
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
    }

    // Transform deposits to transaction format
    const depositTransactions = deposits.map((deposit) => ({
      id: deposit._id.toString(),
      type: 'deposit' as const,
      amount: deposit.amount,
      status: deposit.status,
      createdAt: deposit.createdAt.toISOString(),
      transactionHash: deposit.transactionId,
    }));

    // Transform orders to transaction format
    const orderTransactions = orders.map((order) => ({
      id: order._id.toString(),
      type: 'order' as const,
      amount: order.totalPrice,
      status: order.status === 'completed' ? 'delivered' : order.status === 'cancelled' ? 'cancelled' : order.status === 'processing' ? 'processing' : 'pending',
      createdAt: order.createdAt.toISOString(),
      productName: (order.product as any)?.name,
    }));

    // Transform wallet transactions (admin credit/debit) to transaction format
    const adminTransactions = walletTransactions.map((transaction) => ({
      id: transaction._id.toString(),
      type: transaction.type === 'credit' ? 'credit' as const : 'debit' as const,
      amount: transaction.amount,
      status: 'completed' as const,
      createdAt: transaction.createdAt.toISOString(),
      description: transaction.description,
    }));

    // Combine and sort by date
    const allTransactions = [...depositTransactions, ...orderTransactions, ...adminTransactions]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    res.json({
      success: true,
      data: {
        transactions: allTransactions,
      },
    });
  } catch (error: any) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get transactions',
    });
  }
};

// Get user orders
export const getUserOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const page = parseInt(req.query.page as string) || 1;
    const skip = (page - 1) * limit;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    const orders = await Order.find({ user: userId })
      .populate('product', 'name category')
      .populate({
        path: 'product',
        populate: {
          path: 'category',
          select: 'name',
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Order.countDocuments({ user: userId });

    const formattedOrders = orders.map((order: any) => ({
      id: order._id.toString(),
      orderNumber: `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
      productName: order.product?.name || 'Unknown Product',
      category: order.product?.category?.name || 'Uncategorized',
      amount: order.totalPrice,
      status: order.status,
      quantity: order.quantity,
      deliveryInfo: order.deliveryInfo,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));

    res.json({
      success: true,
      data: {
        orders: formattedOrders,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get orders',
    });
  }
};

// Get single order by ID (user's own order)
export const getUserOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    const order = await Order.findOne({ _id: id, user: userId })
      .populate('product', 'name category description price')
      .populate({
        path: 'product',
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
    console.error('Get user order by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get order',
    });
  }
};

// Get all active categories with active subcategories (for users)
export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Fetch only active categories, sorted by creation date
    const categories = await Category.find({ isActive: true })
      .sort({ createdAt: 1 })
      .lean();

    const formattedCategories = categories.map((category: any) => {
      // Filter and sort only active subcategories
      const activeSubCategories = category.subCategories
        .filter((sub: any) => sub.isActive === true)
        .sort((a: any, b: any) => {
          // Sort by _id which is roughly chronological
          return a._id.toString().localeCompare(b._id.toString());
        })
        .map((sub: any) => ({
          id: sub._id.toString(),
          name: sub.name,
          categoryId: category._id.toString(),
        }));

      return {
        id: category._id.toString(),
        name: category.name,
        subCategories: activeSubCategories,
      };
    });

    res.json({
      success: true,
      data: formattedCategories,
    });
  } catch (error: any) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get categories',
    });
  }
};

// Get all active products (for users)
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, subCategory, search } = req.query;
    
    // Build query for active products only
    const query: any = { isActive: true };

    // Filter by category if provided
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category as string)) {
        query.category = new mongoose.Types.ObjectId(category as string);
      } else {
        res.status(400).json({
          success: false,
          message: 'Invalid category ID',
        });
        return;
      }
    }

    // Filter by subcategory if provided
    if (subCategory) {
      // Find the subcategory by ID to get its slug
      if (mongoose.Types.ObjectId.isValid(subCategory as string)) {
        const allCategories = await Category.find({ isActive: true }).lean();
        let subCategorySlug: string | undefined;
        
        for (const cat of allCategories) {
          const sub = (cat as any).subCategories.find(
            (s: any) => s._id.toString() === subCategory
          );
          if (sub && sub.isActive) {
            subCategorySlug = sub.slug;
            break;
          }
        }
        
        if (subCategorySlug) {
          query.subCategory = subCategorySlug;
        } else {
          // Subcategory not found or inactive
          res.json({
            success: true,
            data: {
              products: [],
              total: 0,
            },
          });
          return;
        }
      } else {
        res.status(400).json({
          success: false,
          message: 'Invalid subcategory ID',
        });
        return;
      }
    }

    // Search functionality
    if (search && typeof search === 'string') {
      query.$text = { $search: search };
    }

    // Fetch products with category population
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .lean();

    const total = await Product.countDocuments(query);

    // Get all categories with subcategories for subcategory lookup
    const allCategories = await Category.find({ isActive: true }).lean();
    const subCategoryMap = new Map<string, { id: string; name: string; slug: string }>();
    
    allCategories.forEach((cat: any) => {
      cat.subCategories?.forEach((sub: any) => {
        if (sub.isActive) {
          subCategoryMap.set(sub.slug, {
            id: sub._id.toString(),
            name: sub.name,
            slug: sub.slug,
          });
        }
      });
    });

    // Format products
    const formattedProducts = products.map((product: any) => {
      // Find subcategory info if exists
      let subCategoryInfo: any = null;
      if (product.subCategory) {
        subCategoryInfo = subCategoryMap.get(product.subCategory);
      }

      return {
        id: product._id.toString(),
        name: product.name,
        description: product.description,
        price: product.price,
        categoryId: product.category?._id?.toString() || null,
        categoryName: product.category?.name || 'Uncategorized',
        subCategoryId: subCategoryInfo?.id || null,
        subCategoryName: subCategoryInfo?.name || null,
        image: product.image,
        stock: product.stock,
        balance: product.balance,
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
      },
    });
  } catch (error: any) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get products',
    });
  }
};

// Purchase a product (create order)
export const purchaseProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { productId, quantity = 1 } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    // Validation
    if (!productId) {
      res.status(400).json({
        success: false,
        message: 'Product ID is required',
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
      return;
    }

    const qty = parseInt(quantity) || 1;
    if (qty < 1) {
      res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1',
      });
      return;
    }

    // Find product
    const product = await Product.findById(productId).populate('category', 'name');
    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Product not found',
      });
      return;
    }

    if (!product.isActive) {
      res.status(400).json({
        success: false,
        message: 'Product is not available',
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

    // Calculate total price
    const totalPrice = product.price * qty;

    // Check balance BEFORE debiting
    if (wallet.balance < totalPrice) {
      res.status(400).json({
        success: false,
        message: `Insufficient balance. You need $${totalPrice.toFixed(2)} but have $${wallet.balance.toFixed(2)}`,
      });
      return;
    }

    // Debit wallet balance
    wallet.balance -= totalPrice;
    await wallet.save();

    // Create order with completed status after successful debit (no need to create separate transaction - order itself is the transaction)
    const order = await Order.create({
      user: userId,
      product: productId,
      quantity: qty,
      totalPrice,
      status: 'completed', // Set to completed immediately after successful debit
    });

    // Get user info for email
    const user = await User.findById(userId).select('email username').lean();
    
    // Send confirmation email (non-blocking)
    if (user) {
      const orderNumber = `ORD-${order._id.toString().slice(-6).toUpperCase()}`;
      sendOrderConfirmationEmail(
        user.email,
        user.username,
        orderNumber,
        product.name,
        totalPrice,
        order._id.toString()
      ).catch((emailError) => {
        console.error('Failed to send order confirmation email:', emailError);
        // Don't fail the request if email fails
      });
    }

    // Emit socket event for real-time update (if socket is available)
    const io = (req as any).app?.get('io');
    if (io) {
      io.to(`user-${userId}`).emit('order:update', {
        orderId: order._id.toString(),
        status: order.status,
      });
      io.to('admin-room').emit('order:update', {
        orderId: order._id.toString(),
        status: order.status,
      });
    }

    // Format response
    const formattedOrder = {
      id: order._id.toString(),
      orderNumber: `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
      productName: product.name,
      category: (product.category as any)?.name || 'Uncategorized',
      amount: totalPrice,
      quantity: qty,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };

    res.json({
      success: true,
      data: formattedOrder,
      message: 'Order placed successfully',
    });
  } catch (error: any) {
    console.error('Purchase product error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to purchase product',
    });
  }
};

// Get all active payment methods (for users)
export const getPaymentMethods = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Fetch only active payment methods
    const paymentMethods = await PaymentMethod.find({ isActive: true })
      .sort({ createdAt: 1 })
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

// Create a deposit
export const createDeposit = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { paymentMethodId, amount, transactionId } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    // Validation
    if (!paymentMethodId) {
      res.status(400).json({
        success: false,
        message: 'Payment method is required',
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      res.status(400).json({
        success: false,
        message: 'Please enter a valid amount',
      });
      return;
    }

    if (!transactionId || !transactionId.trim()) {
      res.status(400).json({
        success: false,
        message: 'Transaction hash is required',
      });
      return;
    }

    // Find payment method
    const paymentMethod = await PaymentMethod.findById(paymentMethodId);
    if (!paymentMethod || !paymentMethod.isActive) {
      res.status(404).json({
        success: false,
        message: 'Payment method not found or inactive',
      });
      return;
    }

    const depositAmount = parseFloat(amount);

    // Validate min/max deposit
    if (paymentMethod.minDeposit && depositAmount < paymentMethod.minDeposit) {
      res.status(400).json({
        success: false,
        message: `Minimum deposit is ${paymentMethod.minDeposit} ${paymentMethod.symbol}`,
      });
      return;
    }

    if (paymentMethod.maxDeposit && depositAmount > paymentMethod.maxDeposit) {
      res.status(400).json({
        success: false,
        message: `Maximum deposit is ${paymentMethod.maxDeposit} ${paymentMethod.symbol}`,
      });
      return;
    }

    // Get user info
    const user = await User.findById(userId).select('email username').lean();
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Create deposit
    const deposit = await Deposit.create({
      user: userId,
      amount: depositAmount,
      paymentMethod: paymentMethod.symbol,
      transactionId: transactionId.trim(),
      status: 'pending',
    });

    // Notify admin via Telegram (non-blocking)
    notifyAdmin(
      `💰 <b>New Deposit Submitted</b>\n` +
      `👤 User: ${user.username || user.email}\n` +
      `💵 Amount: ${paymentMethod.symbol} ${depositAmount}\n` +
      `🔖 Tx Hash: ${transactionId.trim()}\n` +
      `🆔 Deposit ID: ${deposit._id.toString()}`
    );

    // Send confirmation email to user (non-blocking)
    sendDepositSubmissionEmail(
      user.email,
      user.username,
      depositAmount,
      paymentMethod.symbol,
      transactionId.trim(),
      deposit._id.toString()
    ).catch((emailError) => {
      console.error('Failed to send deposit submission email:', emailError);
    });

    res.json({
      success: true,
      data: {
        id: deposit._id.toString(),
        amount: deposit.amount,
        paymentMethod: deposit.paymentMethod,
        status: deposit.status,
        transactionId: deposit.transactionId,
        createdAt: deposit.createdAt,
      },
      message: 'Deposit submitted successfully. It will be reviewed by our team.',
    });
  } catch (error: any) {
    console.error('Create deposit error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create deposit',
    });
  }
};
