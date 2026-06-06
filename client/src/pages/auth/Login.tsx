import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { setCredentials, setLoading } from '../../store/slices/authSlice';
import { authService } from '../../services/api/authService';
import type { LoginCredentials } from '../../types';
import { env } from '../../config/env';
import toast from 'react-hot-toast';
import { HiEye, HiEyeOff } from 'react-icons/hi';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);
  const [formData, setFormData] = useState<LoginCredentials>({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const isSubmittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSubmittingRef.current || isLoading) return;
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }
    isSubmittingRef.current = true;
    dispatch(setLoading(true));
    try {
      try {
        const response = await authService.login(formData);
        dispatch(setCredentials(response));
        toast.success('Login successful!');
        navigate(response.user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard', { replace: true });
        return;
      } catch {
        const adminResponse = await authService.loginAdmin(formData);
        dispatch(setCredentials(adminResponse));
        toast.success('Login successful!');
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (err: any) {
      let msg = 'Login failed. Please check your credentials.';
      if (err.response) msg = err.response.data?.message || msg;
      else if (err.request) msg = 'Unable to connect to server.';
      else if (err.message) msg = err.message;
      toast.error(msg);
    } finally {
      dispatch(setLoading(false));
      isSubmittingRef.current = false;
    }
  };

  return (
    <div className="min-h-screen flex bg-red-50/40 auth-root">
      <div className="w-full max-w-lg mx-auto px-4 py-10">
        {/* Brand */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-primary-600">{env.appName}</h2>
          <p className="text-sm text-gray-400 mt-1.5">Sign in to continue</p>
        </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Email</label>
              <input
                type="email" required
                className="w-full px-4 py-3 text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none placeholder:text-gray-400"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-600">Password</label>
                <Link to="/forgot-password" className="text-xs font-medium text-primary-500 hover:text-primary-600">Forgot?</Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} required
                  className="w-full px-4 py-3 text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none placeholder:text-gray-400 pr-10"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <HiEyeOff className="w-4 h-4" /> : <HiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 text-base font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

        <p className="text-sm text-gray-400 text-center mt-6">
          No account yet?{' '}
          <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700">Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
