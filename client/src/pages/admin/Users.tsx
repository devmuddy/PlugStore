import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlineTrash,
  HiOutlineCalendar,
  HiOutlineUserCircle,
  HiSearch,
  HiX,
  HiPlus,
  HiMinus,
  HiRefresh,
} from 'react-icons/hi';
import type { User } from '../../types';
import { adminService } from '../../services/api/adminService';

interface UserWithBalance extends User {
  balance?: number;
}

const Users = () => {
  const [users, setUsers] = useState<UserWithBalance[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithBalance | null>(null);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithBalance | null>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceAction, setBalanceAction] = useState<'add' | 'subtract'>('add');
  const [isUpdatingBalance, setIsUpdatingBalance] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const usersData = await adminService.getAllUsers();
      setUsers(usersData);
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      toast.error(error.response?.data?.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchUsers();
  }, []);

  // Refresh users
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchUsers();
      toast.success('Users refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh users');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter users based on search
  const filteredUsers = users.filter((user) => {
    return (
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      false
    );
  });

  const handleDeleteClick = (user: UserWithBalance) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      await adminService.deleteUser(userToDelete.id);
      
      setUsers(users.filter((user) => user.id !== userToDelete.id));
      setShowDeleteModal(false);
      setUserToDelete(null);
      toast.success('User deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getInitials = (email: string, username?: string) => {
    if (username) {
      return username.substring(0, 2).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const handleManageBalance = (user: UserWithBalance) => {
    setSelectedUser(user);
    setBalanceAmount('');
    setBalanceAction('add');
    setShowBalanceModal(true);
  };

  const handleUpdateBalance = async () => {
    if (!selectedUser || !balanceAmount || parseFloat(balanceAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsUpdatingBalance(true);
    try {
      const amount = parseFloat(balanceAmount);
      const response = await adminService.updateUserBalance(
        selectedUser.id,
        amount,
        balanceAction
      );

      // Refresh users to get updated data
      await fetchUsers();
      
      setShowBalanceModal(false);
      setSelectedUser(null);
      setBalanceAmount('');
      toast.success(response.message || `Balance ${balanceAction === 'add' ? 'added' : 'subtracted'} successfully`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update balance');
    } finally {
      setIsUpdatingBalance(false);
    }
  };

  const formatBalance = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="space-y-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Users Management</h1>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 w-8 inline-flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Refresh users"
              title="Refresh users"
            >
              <HiRefresh className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-gray-600">
            View and manage all platform users
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by email or username..."
            className="w-full pl-10 pr-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <HiX className="w-5 h-5" />
            </button>
          )}
        </div>

      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-3 sm:px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-3 sm:px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-3 sm:px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Joined
                  </th>
                  <th className="px-3 sm:px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {getInitials(user.email, user.username)}
                            </span>
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                            {user.username || 'No username'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex flex-col items-start space-y-1.5">
                        <span className="text-xs sm:text-sm font-semibold text-gray-900">
                          ${formatBalance(user.balance || 0)}
                        </span>
                        <button
                          onClick={() => handleManageBalance(user)}
                          className="px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded transition-colors"
                        >
                          Manage
                        </button>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-500 hidden md:table-cell">
                      <div className="flex items-center space-x-2">
                        <HiOutlineCalendar className="w-4 h-4 text-gray-400" />
                        <span>{formatDate(user.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteClick(user)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs sm:text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <HiOutlineUserCircle className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-xs sm:text-sm font-medium text-gray-900 mb-1">No users found</p>
                      <p className="text-xs text-gray-500">
                        {searchQuery
                          ? 'Try adjusting your search'
                          : 'No users registered yet'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Balance Management Modal */}
      {showBalanceModal && selectedUser && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                Manage Balance
              </h3>
              <button
                onClick={() => {
                  setShowBalanceModal(false);
                  setSelectedUser(null);
                  setBalanceAmount('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-2">
                  User: <span className="font-medium text-gray-900">{selectedUser.username || selectedUser.email}</span>
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  Current Balance: <span className="font-semibold text-gray-900">${formatBalance(selectedUser.balance || 0)}</span>
                </p>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Action
                </label>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setBalanceAction('add')}
                    className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                      balanceAction === 'add'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <HiPlus className="w-4 h-4" />
                    <span className="text-xs sm:text-sm font-medium">Add</span>
                  </button>
                  <button
                    onClick={() => setBalanceAction('subtract')}
                    className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                      balanceAction === 'subtract'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <HiMinus className="w-4 h-4" />
                    <span className="text-xs sm:text-sm font-medium">Subtract</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  placeholder="0.00"
                  autoFocus
                />
              </div>

              {balanceAmount && parseFloat(balanceAmount) > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600">
                    New Balance:{' '}
                    <span className="font-semibold text-gray-900">
                      $
                      {balanceAction === 'add'
                        ? formatBalance((selectedUser.balance || 0) + parseFloat(balanceAmount))
                        : formatBalance(Math.max(0, (selectedUser.balance || 0) - parseFloat(balanceAmount)))}
                    </span>
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowBalanceModal(false);
                    setSelectedUser(null);
                    setBalanceAmount('');
                  }}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateBalance}
                  disabled={isUpdatingBalance || !balanceAmount || parseFloat(balanceAmount) <= 0}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isUpdatingBalance ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>{balanceAction === 'add' ? 'Add' : 'Subtract'} Balance</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                Delete User
              </h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                disabled={isDeleting}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-2">
                  Are you sure you want to delete this user?
                </p>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs sm:text-sm font-medium text-gray-900">
                    {userToDelete.username || 'No username'}
                  </p>
                  <p className="text-xs text-gray-500">{userToDelete.email}</p>
                </div>
                <p className="mt-3 text-xs text-red-600 font-medium">
                  This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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
                      <span>Delete User</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
