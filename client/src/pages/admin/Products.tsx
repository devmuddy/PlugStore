import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  HiPlus,
  HiOutlineCube,
  HiOutlinePencil,
  HiOutlineTrash,
  HiChevronDown,
  HiChevronRight,
  HiX,
} from 'react-icons/hi';
import { adminService, type Category, type SubCategory, type Product } from '../../services/api/adminService';

const Products = () => {
  const [activeTab, setActiveTab] = useState<'categories' | 'products'>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsPage, setProductsPage] = useState(1);
  const [productsTotal, setProductsTotal] = useState(0);
  const [productsTotalPages, setProductsTotalPages] = useState(1);

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['1']));
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);

  // Form states
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSubCategoryForm, setShowSubCategoryForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [categoryFormData, setCategoryFormData] = useState({ name: '' });
  const [subCategoryFormData, setSubCategoryFormData] = useState({ name: '', categoryId: '' });
  const [productFormData, setProductFormData] = useState({
    name: '',
    description: '',
    price: '',
    balance: '',
    categoryId: '',
    subCategoryId: '',
  });

  // Loading states
  const [isLoadingCategory, setIsLoadingCategory] = useState(false);
  const [isLoadingSubCategory, setIsLoadingSubCategory] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);

  // Fetch categories and products
  const fetchCategories = async () => {
    try {
      const data = await adminService.getAllCategories();
      setCategories(data);
    } catch (error: any) {
      console.error('Failed to fetch categories:', error);
      toast.error(error.response?.data?.message || 'Failed to load categories');
    }
  };

  const fetchProducts = async (page: number = 1) => {
    try {
      setIsLoadingProducts(true);
      const data = await adminService.getAllProducts({ page, limit: 10 });
      setProducts(data.products);
      setProductsTotal(data.total);
      setProductsTotalPages(data.totalPages);
      setProductsPage(data.page);
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
      toast.error(error.response?.data?.message || 'Failed to load products');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts(productsPage);
    }
  }, [productsPage, activeTab]);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleAddCategory = async () => {
    if (!categoryFormData.name.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    setIsLoadingCategory(true);
    try {
      const newCategory = await adminService.createCategory({
        name: categoryFormData.name,
      });
      setCategories([...categories, newCategory]);
      setCategoryFormData({ name: '' });
      setShowCategoryForm(false);
      toast.success('Category added successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add category');
    } finally {
      setIsLoadingCategory(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData({ name: category.name });
    setShowCategoryForm(true);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !categoryFormData.name.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    setIsLoadingCategory(true);
    try {
      const updatedCategory = await adminService.updateCategory(editingCategory.id, {
        name: categoryFormData.name,
      });
      setCategories(
        categories.map((cat) =>
          cat.id === editingCategory.id ? updatedCategory : cat
        )
      );
      setCategoryFormData({ name: '' });
      setEditingCategory(null);
      setShowCategoryForm(false);
      toast.success('Category updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update category');
    } finally {
      setIsLoadingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this category? All sub-categories and products will be deleted.')) {
      try {
        await adminService.deleteCategory(categoryId);
        setCategories(categories.filter((cat) => cat.id !== categoryId));
        setProducts(products.filter((p) => p.categoryId !== categoryId));
        toast.success('Category deleted successfully');
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to delete category');
      }
    }
  };

  const handleAddSubCategory = async () => {
    if (!subCategoryFormData.name.trim()) {
      toast.error('Please enter a sub-category name');
      return;
    }
    if (!subCategoryFormData.categoryId) {
      toast.error('Please select a category');
      return;
    }

    setIsLoadingSubCategory(true);
    try {
      const newSubCategory = await adminService.addSubCategory(subCategoryFormData.categoryId, {
        name: subCategoryFormData.name,
      });
      setCategories(
        categories.map((cat) =>
          cat.id === subCategoryFormData.categoryId
            ? { ...cat, subCategories: [...cat.subCategories, newSubCategory] }
            : cat
        )
      );
      setSubCategoryFormData({ name: '', categoryId: '' });
      setShowSubCategoryForm(false);
      setSelectedCategory(null);
      toast.success('Sub-category added successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add sub-category');
    } finally {
      setIsLoadingSubCategory(false);
    }
  };

  const handleEditSubCategory = (subCategory: SubCategory) => {
    setEditingSubCategory(subCategory);
    setSubCategoryFormData({ name: subCategory.name, categoryId: subCategory.categoryId });
    setShowSubCategoryForm(true);
  };

  const handleUpdateSubCategory = async () => {
    if (!editingSubCategory || !subCategoryFormData.name.trim()) {
      toast.error('Please enter a sub-category name');
      return;
    }

    setIsLoadingSubCategory(true);
    try {
      const updatedSubCategory = await adminService.updateSubCategory(
        editingSubCategory.categoryId,
        editingSubCategory.id,
        { name: subCategoryFormData.name }
      );
      setCategories(
        categories.map((cat) =>
          cat.id === editingSubCategory.categoryId
            ? {
                ...cat,
                subCategories: cat.subCategories.map((sub) =>
                  sub.id === editingSubCategory.id ? updatedSubCategory : sub
                ),
              }
            : cat
        )
      );
      setSubCategoryFormData({ name: '', categoryId: '' });
      setEditingSubCategory(null);
      setShowSubCategoryForm(false);
      toast.success('Sub-category updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update sub-category');
    } finally {
      setIsLoadingSubCategory(false);
    }
  };

  const handleDeleteSubCategory = async (subCategoryId: string, categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this sub-category? All products in this sub-category will be deleted.')) {
      try {
        await adminService.deleteSubCategory(categoryId, subCategoryId);
        setCategories(
          categories.map((cat) =>
            cat.id === categoryId
              ? { ...cat, subCategories: cat.subCategories.filter((sub) => sub.id !== subCategoryId) }
              : cat
          )
        );
        setProducts(products.filter((p) => p.subCategoryId !== subCategoryId));
        toast.success('Sub-category deleted successfully');
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to delete sub-category');
      }
    }
  };

  const handleAddProduct = async () => {
    if (!productFormData.name.trim()) {
      toast.error('Please enter a product name');
      return;
    }
    if (!productFormData.description.trim()) {
      toast.error('Please enter a product description');
      return;
    }
    if (!productFormData.price || parseFloat(productFormData.price) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    if (!productFormData.categoryId) {
      toast.error('Please select a category');
      return;
    }

    setIsLoadingProduct(true);
    try {
      const newProduct = await adminService.createProduct({
        name: productFormData.name,
        description: productFormData.description,
        price: productFormData.price,
        balance: productFormData.balance || undefined,
        categoryId: productFormData.categoryId,
        subCategoryId: productFormData.subCategoryId || undefined,
      });
      setProducts([...products, newProduct]);
      setProductFormData({
        name: '',
        description: '',
        price: '',
        balance: '',
        categoryId: '',
        subCategoryId: '',
      });
      setShowProductForm(false);
      toast.success('Product added successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add product');
    } finally {
      setIsLoadingProduct(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      balance: product.balance?.toString() || '',
      categoryId: product.categoryId,
      subCategoryId: product.subCategoryId || '',
    });
    setShowProductForm(true);
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    
    if (!productFormData.name.trim()) {
      toast.error('Please enter a product name');
      return;
    }
    if (!productFormData.description.trim()) {
      toast.error('Please enter a product description');
      return;
    }
    if (!productFormData.price || parseFloat(productFormData.price) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    if (!productFormData.categoryId) {
      toast.error('Please select a category');
      return;
    }

    setIsLoadingProduct(true);
    try {
      await adminService.updateProduct(editingProduct.id, {
        name: productFormData.name,
        description: productFormData.description,
        price: productFormData.price,
        balance: productFormData.balance || undefined,
        categoryId: productFormData.categoryId,
        subCategoryId: productFormData.subCategoryId || undefined,
      });
      // Refresh products list
      fetchProducts(productsPage);
      setProductFormData({
        name: '',
        description: '',
        price: '',
        balance: '',
        categoryId: '',
        subCategoryId: '',
      });
      setEditingProduct(null);
      setShowProductForm(false);
      toast.success('Product updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update product');
    } finally {
      setIsLoadingProduct(false);
    }
  };

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    try {
      await adminService.deleteProduct(productToDelete.id);
      // Refresh products list
      fetchProducts(productsPage);
      toast.success('Product deleted successfully');
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };


  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || 'Unknown';
  };

  const getSubCategoryName = (subCategoryId: string) => {
    for (const category of categories) {
      const sub = category.subCategories.find((s) => s.id === subCategoryId);
      if (sub) return sub.name;
    }
    return 'None';
  };

  // Note: Filtering is now handled server-side with pagination

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Products Management</h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-600">
            Manage categories, sub-categories, and products
          </p>
        </div>
        <button
          onClick={() => {
            setShowProductForm(true);
            setEditingProduct(null);
            setProductFormData({
              name: '',
              description: '',
              price: '',
              balance: '',
              categoryId: '',
              subCategoryId: '',
            });
          }}
          className="flex items-center justify-center space-x-2 bg-primary-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors w-full sm:w-auto"
        >
          <HiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="whitespace-nowrap">Add Product</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${
            activeTab === 'categories'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Categories
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${
            activeTab === 'products'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Products ({productsTotal})
        </button>
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Categories</h2>
            <button
              onClick={() => {
                setShowCategoryForm(true);
                setEditingCategory(null);
                setCategoryFormData({ name: '' });
              }}
              className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 text-xs sm:text-sm font-medium"
            >
              <HiPlus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </div>

          {/* Categories List */}
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category.id} className="bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center space-x-3 flex-1">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {expandedCategories.has(category.id) ? (
                        <HiChevronDown className="w-5 h-5" />
                      ) : (
                        <HiChevronRight className="w-5 h-5" />
                      )}
                    </button>
                    <HiOutlineCube className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{category.name}</span>
                    <span className="text-xs text-gray-500">
                      ({category.subCategories.length} sub-categories)
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setSubCategoryFormData({ name: '', categoryId: category.id });
                        setShowSubCategoryForm(true);
                        setEditingSubCategory(null);
                      }}
                      className="p-1.5 text-primary-600 hover:bg-primary-50 rounded transition-colors"
                      title="Add Sub-category"
                    >
                      <HiPlus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    >
                      <HiOutlinePencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sub-categories */}
                {expandedCategories.has(category.id) && (
                  <div className="border-t border-gray-200 bg-gray-50">
                    {category.subCategories.length > 0 ? (
                      <div className="p-3 space-y-2">
                        {category.subCategories.map((subCategory) => (
                          <div
                            key={subCategory.id}
                            className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
                          >
                            <span className="text-xs sm:text-sm text-gray-700">{subCategory.name}</span>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleEditSubCategory(subCategory)}
                                className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                              >
                                <HiOutlinePencil className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteSubCategory(subCategory.id, category.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <HiOutlineTrash className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 text-xs text-gray-500 text-center">
                        No sub-categories yet
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedCategory || ''}
              onChange={(e) => {
                setSelectedCategory(e.target.value || null);
                setSelectedSubCategory(null);
              }}
              className="px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {selectedCategory && (
              <select
                value={selectedSubCategory || ''}
                onChange={(e) => setSelectedSubCategory(e.target.value || null)}
                className="px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              >
                <option value="">All Sub-categories</option>
                {categories
                  .find((c) => c.id === selectedCategory)
                  ?.subCategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
              </select>
            )}

            {(selectedCategory || selectedSubCategory) && (
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedSubCategory(null);
                }}
                className="flex items-center space-x-1 text-xs sm:text-sm text-gray-600 hover:text-gray-900"
              >
                <HiX className="w-4 h-4" />
                <span>Clear Filters</span>
              </button>
            )}
          </div>

          {/* Products Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-3 sm:px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-3 sm:px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Category
                    </th>
                    <th className="px-3 sm:px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Sub-category
                    </th>
                    <th className="px-3 sm:px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-3 sm:px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-3 sm:px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.length > 0 ? (
                    products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 sm:px-4 py-3">
                          <div>
                            <p className="text-xs sm:text-sm font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500 hidden sm:block">{product.description}</p>
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 hidden sm:table-cell">
                          {getCategoryName(product.categoryId)}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-500 hidden md:table-cell">
                          {product.subCategoryId ? getSubCategoryName(product.subCategoryId) : 'None'}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold text-gray-900">
                          ${typeof product.price === 'number' ? product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : product.price}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-900">
                          {product.balance ? `$${typeof product.balance === 'number' ? product.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : product.balance}` : 'N/A'}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            >
                              <HiOutlinePencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <HiOutlineTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center">
                        <div className="flex flex-col items-center">
                          <HiOutlineCube className="w-10 h-10 text-gray-300 mb-2" />
                          <p className="text-xs sm:text-sm text-gray-500">No products found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {productsTotalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-3 sm:px-4 py-3 bg-white border-t border-gray-200 gap-3">
              <div className="text-xs sm:text-sm text-gray-700">
                Showing <span className="font-medium">{(productsPage - 1) * 10 + 1}</span> to{' '}
                <span className="font-medium">{Math.min(productsPage * 10, productsTotal)}</span> of{' '}
                <span className="font-medium">{productsTotal}</span> products
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setProductsPage((p) => Math.max(1, p - 1))}
                  disabled={productsPage === 1 || isLoadingProducts}
                  className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 text-xs sm:text-sm text-gray-700">
                  Page {productsPage} of {productsTotalPages}
                </span>
                <button
                  onClick={() => setProductsPage((p) => Math.min(productsTotalPages, p + 1))}
                  disabled={productsPage === productsTotalPages || isLoadingProducts}
                  className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Category Form Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h3>
              <button
                onClick={() => {
                  setShowCategoryForm(false);
                  setEditingCategory(null);
                  setCategoryFormData({ name: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ name: e.target.value })}
                  className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  placeholder="Enter category name"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCategoryForm(false);
                    setEditingCategory(null);
                    setCategoryFormData({ name: '' });
                  }}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
                  disabled={isLoadingCategory}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isLoadingCategory ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <span>{editingCategory ? 'Update' : 'Add'}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-category Form Modal */}
      {showSubCategoryForm && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                {editingSubCategory ? 'Edit Sub-category' : 'Add Sub-category'}
              </h3>
              <button
                onClick={() => {
                  setShowSubCategoryForm(false);
                  setEditingSubCategory(null);
                  setSubCategoryFormData({ name: '', categoryId: '' });
                  setSelectedCategory(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={subCategoryFormData.categoryId}
                  onChange={(e) => setSubCategoryFormData({ ...subCategoryFormData, categoryId: e.target.value })}
                  className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  disabled={!!selectedCategory}
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Sub-category Name
                </label>
                <input
                  type="text"
                  value={subCategoryFormData.name}
                  onChange={(e) => setSubCategoryFormData({ ...subCategoryFormData, name: e.target.value })}
                  className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  placeholder="Enter sub-category name"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowSubCategoryForm(false);
                    setEditingSubCategory(null);
                    setSubCategoryFormData({ name: '', categoryId: '' });
                    setSelectedCategory(null);
                  }}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingSubCategory ? handleUpdateSubCategory : handleAddSubCategory}
                  disabled={isLoadingSubCategory}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isLoadingSubCategory ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <span>{editingSubCategory ? 'Update' : 'Add'}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {showProductForm && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h3>
              <button
                onClick={() => {
                  setShowProductForm(false);
                  setEditingProduct(null);
                  setProductFormData({
                    name: '',
                    description: '',
                    price: '',
                    balance: '',
                    categoryId: '',
                    subCategoryId: '',
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={productFormData.name}
                    onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    placeholder="Enter product name"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={productFormData.categoryId}
                    onChange={(e) => {
                      setProductFormData({
                        ...productFormData,
                        categoryId: e.target.value,
                        subCategoryId: '',
                      });
                    }}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Sub-category (Optional)
                </label>
                <select
                  value={productFormData.subCategoryId}
                  onChange={(e) => setProductFormData({ ...productFormData, subCategoryId: e.target.value })}
                  className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  disabled={!productFormData.categoryId}
                >
                  <option value="">Select sub-category</option>
                  {categories
                    .find((c) => c.id === productFormData.categoryId)
                    ?.subCategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={productFormData.description}
                  onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                  className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                  rows={3}
                  placeholder="Enter product description"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={productFormData.price}
                  onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })}
                  className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Balance ($) <span className="text-gray-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={productFormData.balance}
                  onChange={(e) => setProductFormData({ ...productFormData, balance: e.target.value })}
                  className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  placeholder="0.00"
                />
                <p className="mt-1 text-xs text-gray-500">Some products may require a balance amount</p>
              </div>
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowProductForm(false);
                    setEditingProduct(null);
                    setProductFormData({
                      name: '',
                      description: '',
                      price: '',
                      balance: '',
                      categoryId: '',
                      subCategoryId: '',
                    });
                  }}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingProduct ? handleUpdateProduct : handleAddProduct}
                  disabled={isLoadingProduct}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isLoadingProduct ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <span>{editingProduct ? 'Update' : 'Add'}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Delete Product</h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProductToDelete(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isDeleting}
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">
                Are you sure you want to delete this product?
              </p>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-sm font-medium text-gray-900">{productToDelete.name}</p>
                <p className="text-xs text-gray-500 mt-1">{productToDelete.description}</p>
              </div>
              <p className="text-xs text-red-600 mt-3">
                This action cannot be undone. The product will be permanently deleted.
              </p>
            </div>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProductToDelete(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteProduct}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <HiOutlineTrash className="w-4 h-4" />
                    <span>Delete Product</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Delete Product</h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProductToDelete(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isDeleting}
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">
                Are you sure you want to delete this product?
              </p>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-sm font-medium text-gray-900">{productToDelete.name}</p>
                <p className="text-xs text-gray-500 mt-1">{productToDelete.description}</p>
              </div>
              <p className="text-xs text-red-600 mt-3">
                This action cannot be undone. The product will be permanently deleted.
              </p>
            </div>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProductToDelete(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteProduct}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <HiOutlineTrash className="w-4 h-4" />
                    <span>Delete Product</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;

