import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { AxiosError } from 'axios';
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

  const getApiErrorMessage = useCallback((error: unknown, fallback: string): string => {
    const axiosError = error as AxiosError<{ message?: string }>;
    return axiosError.response?.data?.message || fallback;
  }, []);

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

  const fetchCategories = useCallback(async () => {
    try {
      setCategories(await categoryService.getCategories());
    } catch (error: unknown) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  const fetchProducts = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      const params: { category?: string; subCategory?: string } = {};
      if (categoryId)    params.category    = categoryId;
      if (subCategoryId) params.subCategory = subCategoryId;
      const response = await userService.getProducts(params);
      setProducts(response.products);
      setTotal(response.total);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Failed to load products'));
      setProducts([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [categoryId, subCategoryId, getApiErrorMessage]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handlePurchase = async (product: Product) => {
    if (purchasingProductId) return;
    try {
      setPurchasingProductId(product.id);
      const order = await userService.purchaseProduct({ productId: product.id, quantity: 1 });
      toast.success(`Order placed! #${order.orderNumber}`);
      setTimeout(() => navigate('/user/dashboard'), 1500);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Failed to purchase product'));
    } finally {
      setPurchasingProductId(null);
    }
  };

  const pageTitle = subCategoryName || categoryName || 'Products';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate('/user/dashboard')}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-primary-600 transition-colors"
        >
          <HiArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>

        <div className="flex items-center gap-2">
          {!isLoading && total > 0 && (
            <span className="text-[11px] font-semibold text-gray-400">
              {total} items
            </span>
          )}
          <button
            onClick={() => fetchProducts(true)}
            disabled={isLoading || isRefreshing}
            className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-primary-600 disabled:opacity-40 transition-colors"
          >
            <HiRefresh className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <h1 className="auth-heading text-2xl font-extrabold text-gray-900 tracking-tight">
          {pageTitle}
        </h1>
        {categoryName && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-gray-400">
            <span className="font-semibold">{categoryName}</span>
            {subCategoryName && (
              <>
                <span className="opacity-60">/</span>
                <span className="font-semibold">{subCategoryName}</span>
              </>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl p-4 animate-pulse">
              <div className="flex items-start justify-between gap-3">
                <div className="h-4 w-40 bg-gray-100 rounded" />
                <div className="h-5 w-16 bg-gray-100 rounded" />
              </div>
              <div className="mt-3 space-y-2">
                <div className="h-3 w-full bg-gray-50 rounded" />
                <div className="h-3 w-3/4 bg-gray-50 rounded" />
              </div>
              <div className="mt-5 h-10 w-full bg-gray-100 rounded-full" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const isPurchasing = purchasingProductId === product.id;
            const isAnyPurchasing = purchasingProductId !== null;
            const hasBalance = product.balance !== undefined && product.balance !== null;

            return (
              <div
                key={product.id}
                className="group rounded-2xl p-4 transition-shadow hover:shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="auth-heading text-sm font-bold text-gray-900 leading-snug line-clamp-2">
                    {product.name}
                  </h3>

                  <div className="shrink-0 text-right">
                    <div className="text-base font-extrabold text-gray-900 tabular-nums">
                      ${product.price.toFixed(2)}
                    </div>
                    {hasBalance && (
                      <div className="mt-0.5 text-[11px] font-semibold text-green-600 tabular-nums">
                        ${formatNumber(product.balance!)} available
                      </div>
                    )}
                  </div>
                </div>

                {product.description && (
                  <p className="mt-2 text-xs text-gray-400 leading-relaxed line-clamp-2">
                    {product.description}
                  </p>
                )}

                <div className="mt-4">
                  <button
                    onClick={() => handlePurchase(product)}
                    disabled={isAnyPurchasing}
                    className="w-full h-10 flex items-center justify-center gap-2 rounded-full text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-80 active:scale-[0.99]"
                    style={{
                      background:
                        isPurchasing || isAnyPurchasing
                          ? '#fca5a5'
                          : 'linear-gradient(135deg, #dc2626, #b91c1c)',
                      boxShadow:
                        isPurchasing || isAnyPurchasing
                          ? 'none'
                          : '0 12px 26px rgba(220,38,38,0.18)',
                    }}
                  >
                    {isPurchasing ? (
                      <>
                        <svg
                          className="animate-spin h-3.5 w-3.5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing…
                      </>
                    ) : (
                      <>
                        <HiShoppingCart className="w-4 h-4" />
                        Buy now
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Products;
