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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Users</h1>
          <p className="text-xs text-gray-500 mt-0.5">{filteredUsers.length} registered users</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 w-8 inline-flex items-center justify-center text-gray-400 hover:text-gray-600 bg-white border border-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <HiRefresh className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search users..."
          className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder:text-gray-400"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <HiX className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Balance</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Joined</th>
                  <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{user.username || 'No username'}</p>
                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">${formatBalance(user.balance || 0)}</span>
                          <button
                            onClick={() => handleManageBalance(user)}
                            className="text-[10px] font-medium text-primary-600 hover:text-primary-700 px-1.5 py-0.5 rounded hover:bg-primary-50 transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 hidden md:table-cell">
                        <div className="flex items-center gap-1.5">
                          <HiOutlineCalendar className="w-3.5 h-3.5 text-gray-300" />
                          <span>{formatDate(user.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteClick(user)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-red-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <HiOutlineTrash className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                          <HiOutlineUserCircle className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">No users found</p>
                        <p className="text-xs text-gray-400">
                          {searchQuery ? 'Try adjusting your search' : 'No users registered yet'}
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
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900">Manage Balance</h3>
              <button
                onClick={() => { setShowBalanceModal(false); setSelectedUser(null); setBalanceAmount(''); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <HiX className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">User</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{selectedUser.username || selectedUser.email}</p>
                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-200">
                  <span className="text-xs text-gray-500">Balance:</span>
                  <span className="text-sm font-bold text-gray-900">${formatBalance(selectedUser.balance || 0)}</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">Action</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setBalanceAction('add')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                      balanceAction === 'add'
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <HiPlus className="w-3.5 h-3.5" />
                    Add
                  </button>
                  <button
                    onClick={() => setBalanceAction('subtract')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                      balanceAction === 'subtract'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <HiMinus className="w-3.5 h-3.5" />
                    Subtract
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">Amount ($)</p>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder:text-gray-400"
                  placeholder="0.00"
                />
              </div>

              {balanceAmount && parseFloat(balanceAmount) > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">New Balance</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">
                    ${balanceAction === 'add'
                      ? formatBalance((selectedUser.balance || 0) + parseFloat(balanceAmount))
                      : formatBalance(Math.max(0, (selectedUser.balance || 0) - parseFloat(balanceAmount)))}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => { setShowBalanceModal(false); setSelectedUser(null); setBalanceAmount(''); }}
                  className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateBalance}
                  disabled={isUpdatingBalance || !balanceAmount || parseFloat(balanceAmount) <= 0}
                  className="px-3 py-2 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {isUpdatingBalance ? (
                    <><svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg><span>Updating...</span></>
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
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900">Delete User</h3>
              <button
                onClick={() => { setShowDeleteModal(false); setUserToDelete(null); }}
                disabled={isDeleting}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <HiX className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-xs text-gray-500">Are you sure you want to delete this user?</p>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-semibold text-gray-900">{userToDelete.username || 'No username'}</p>
                <p className="text-xs text-gray-500 mt-0.5">{userToDelete.email}</p>
              </div>
              <p className="text-xs text-red-600 font-medium">This action cannot be undone.</p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => { setShowDeleteModal(false); setUserToDelete(null); }}
                  disabled={isDeleting}
                  className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                  className="px-3 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {isDeleting ? (
                    <><svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg><span>Deleting...</span></>
                  ) : (
                    <><HiOutlineTrash className="w-3.5 h-3.5" /><span>Delete</span></>
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
