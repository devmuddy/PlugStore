import express from 'express';
import { updateUserBalance, getDashboardStats, getRecentActivity, getRecentOrders, getAllUsers, deleteUser, getPendingDeposits, approveDeposit, rejectDeposit, getAllPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod, getAllOrders, getOrderById, updateOrderStatus, getAllCategories, createCategory, updateCategory, deleteCategory, addSubCategory, updateSubCategory, deleteSubCategory, getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../controllers/adminController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { uploadFields, uploadToCloudinary, handleUploadError } from '../middleware/upload';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Dashboard routes
router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/recent-activity', getRecentActivity);
router.get('/dashboard/recent-orders', getRecentOrders);

// User management routes
router.get('/users', getAllUsers);
router.delete('/users/:userId', deleteUser);
router.post('/users/:userId/balance', updateUserBalance);

// Deposits management routes
router.get('/deposits/pending', getPendingDeposits);
router.post('/deposits/:depositId/approve', approveDeposit);
router.post('/deposits/:depositId/reject', rejectDeposit);

// Payment methods management routes
router.get('/payment-methods', getAllPaymentMethods);
router.post(
  '/payment-methods',
  uploadFields([
    { name: 'icon', maxCount: 1 },
    { name: 'qrCode', maxCount: 1 },
  ]),
  uploadToCloudinary,
  handleUploadError,
  createPaymentMethod
);
router.put(
  '/payment-methods/:id',
  uploadFields([
    { name: 'icon', maxCount: 1 },
    { name: 'qrCode', maxCount: 1 },
  ]),
  uploadToCloudinary,
  handleUploadError,
  updatePaymentMethod
);
router.delete('/payment-methods/:id', deletePaymentMethod);

// Orders management routes
router.get('/orders', getAllOrders);
router.get('/orders/:id', getOrderById);
router.patch('/orders/:id/status', updateOrderStatus);

// Categories management routes
router.get('/categories', getAllCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Subcategories management routes
router.post('/categories/:id/subcategories', addSubCategory);
router.put('/categories/:id/subcategories/:subCategoryId', updateSubCategory);
router.delete('/categories/:id/subcategories/:subCategoryId', deleteSubCategory);

// Products management routes
router.get('/products', getAllProducts);
router.get('/products/:id', getProductById);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

export default router;

