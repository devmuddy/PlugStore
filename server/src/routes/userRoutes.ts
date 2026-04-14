import express from 'express';
import { getBalance, getTransactions, getUserOrders, getUserOrderById, getCategories, getProducts, purchaseProduct, getPaymentMethods, createDeposit } from '../controllers/userController';
import { authenticate, requireUser } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);
router.use(requireUser);

// Get user balance
router.get('/balance', getBalance);

// Get user transactions
router.get('/transactions', getTransactions);

// Get user orders
router.get('/orders', getUserOrders);

// Get single user order
router.get('/orders/:id', getUserOrderById);

// Create order (purchase product)
router.post('/orders', purchaseProduct);

// Get categories (active only)
router.get('/categories', getCategories);

// Get products (active only)
router.get('/products', getProducts);

// Get payment methods (active only)
router.get('/payment-methods', getPaymentMethods);

// Create deposit
router.post('/deposits', createDeposit);

export default router;
