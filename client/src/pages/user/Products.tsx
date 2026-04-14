import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { userService, type Product } from '../../services/api/userService';
import { categoryService, type Category } from '../../services/api/categoryService';
import { HiShoppingCart, HiRefresh, HiArrowLeft, HiOutlineCube } from 'react-icons/hi';

const Products = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [purchasingProductId, setPurchasingProductId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const formatNumber = (num: number) =>
    num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const categoryId    = searchParams.get('category');
  const subCategoryId = searchParams.get('subCategory');

  const categoryName = (() => {
    if (!categoryId) return null;
    return categories.find(c => c.id === categoryId)?.name || null;
  })();

  const subCategoryName = (() => {
    if (!subCategoryId || !categoryId) return null;
    const cat = categories.find(c => c.id === categoryId);
    return cat?.subCategories.find(s => s.id === subCategoryId)?.name || null;
  })();

  const fetchCategories = async () => {
    try {
      setCategories(await categoryService.getCategories());
    } catch {}
  };

  const fetchProducts = async (isRefresh = false) => {
    try {
      isRefresh ? setIsRefreshing(true) : setIsLoading(true);
      const params: { category?: string; subCategory?: string } = {};
      if (categoryId)    params.category    = categoryId;
      if (subCategoryId) params.subCategory = subCategoryId;
      const response = await userService.getProducts(params);
      setProducts(response.products);
      setTotal(response.total);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load products');
      setProducts([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { fetchProducts(); }, [categoryId, subCategoryId]);

  const handlePurchase = async (product: Product) => {
    if (purchasingProductId) return;
    try {
      setPurchasingProductId(product.id);
      const order = await userService.purchaseProduct({ productId: product.id, quantity: 1 });
      toast.success(`Order placed! #${order.orderNumber}`);
      setTimeout(() => navigate('/user/dashboard'), 1500);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to purchase product');
    } finally {
      setPurchasingProductId(null);
    }
  };

  const pageTitle = subCategoryName || categoryName || 'Products';

  return (
    <div>
      {/* ── Header ─────────────────────────────────────── */}
      <div className="mb-5">
        <button
          onClick={() => navigate('/user/dashboard')}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-primary-600 transition-colors mb-4"
        >
          <HiArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="auth-heading text-xl font-bold text-gray-900">{pageTitle}</h1>
            {categoryName && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[11px] text-gray-400">{categoryName}</span>
                {subCategoryName && (
                  <>
                    <span className="text-gray-300 text-[11px]">›</span>
                    <span className="text-[11px] text-gray-400">{subCategoryName}</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isLoading && total > 0 && (
              <span className="text-[11px] font-semibold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full">
                {total} items
              </span>
            )}
            <button
              onClick={() => fetchProducts(true)}
              disabled={isLoading || isRefreshing}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 disabled:opacity-40 transition-colors"
            >
              <HiRefresh className={`w-3.5 h-3.5 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Loading ─────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse" style={{ border: '1px solid #f1f5f9', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
              <div className="flex justify-between mb-3">
                <div className="h-4 w-36 bg-gray-100 rounded" />
                <div className="h-5 w-16 bg-gray-100 rounded" />
              </div>
              <div className="h-3 w-full bg-gray-50 rounded mb-1.5" />
              <div className="h-3 w-3/4 bg-gray-50 rounded mb-4" />
              <div className="flex justify-between items-center mb-3">
                <div className="h-3 w-20 bg-gray-50 rounded" />
                <div className="h-3 w-16 bg-gray-50 rounded" />
              </div>
              <div className="h-10 w-full bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>

      ) : products.length === 0 ? (
        /* ── Empty ── */
        <div className="py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <HiOutlineCube className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-500">No products found</p>
          <p className="text-xs text-gray-400 mt-1">
            {categoryId ? 'Try a different category.' : 'No products available right now.'}
          </p>
        </div>

      ) : (
        /* ── Product cards ── */
        <div className="space-y-3">
          {products.map((product) => {
            const isPurchasing  = purchasingProductId === product.id;
            const isAnyPurchasing = purchasingProductId !== null;
            const hasBalance = product.balance !== undefined && product.balance !== null;

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl p-4"
                style={{ border: '1px solid #f1f5f9', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
              >
                {/* Name + price */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="auth-heading text-sm font-bold text-gray-900 leading-snug flex-1">
                    {product.name}
                  </h3>
                  <span className="shrink-0 text-base font-bold text-gray-900">
                    ${product.price.toFixed(2)}
                  </span>
                </div>

                {/* Description */}
                {product.description && (
                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-3">
                    {product.description}
                  </p>
                )}

                {/* Balance row */}
                {hasBalance && (
                  <div className="flex items-center justify-between mb-3 py-2 px-3 rounded-xl bg-gray-50">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                      Available balance
                    </span>
                    <span className="text-xs font-bold text-green-600">
                      ${formatNumber(product.balance!)}
                    </span>
                  </div>
                )}

                {/* Buy button */}
                <button
                  onClick={() => handlePurchase(product)}
                  disabled={isAnyPurchasing}
                  className="w-full h-10 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-all disabled:cursor-not-allowed"
                  style={{
                    background: isPurchasing || isAnyPurchasing
                      ? '#93c5fd'
                      : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    boxShadow: isPurchasing || isAnyPurchasing
                      ? 'none'
                      : '0 2px 10px rgba(37,99,235,0.25)',
                  }}
                >
                  {isPurchasing ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing…
                    </>
                  ) : (
                    <>
                      <HiShoppingCart className="w-4 h-4" />
                      Buy Now
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Products;
