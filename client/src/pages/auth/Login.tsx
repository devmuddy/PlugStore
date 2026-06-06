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

      {/* ── LEFT PANEL ─────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[48%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(160deg, #0f172a 0%, #7f1d1d 60%, #b91c1c 100%)' }}
      >
        <div className="absolute inset-0 auth-dot-grid pointer-events-none" />
        <div className="auth-orb-1 absolute -top-24 -right-24 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(248,113,113,0.25) 0%, transparent 70%)' }} />
        <div className="auth-orb-2 absolute bottom-32 -left-20 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.2) 0%, transparent 70%)' }} />
        <div className="auth-orb-3 absolute top-1/2 right-10 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(252,165,165,0.15) 0%, transparent 70%)' }} />

        <div className="relative z-10">
          <h1 className="auth-heading text-white font-extrabold leading-tight mb-5 mt-4"
            style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)' }}>
            Your digital<br />
            <span style={{ color: '#fca5a5' }}>marketplace,</span><br />
            reimagined.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: '1.7', maxWidth: '300px' }}>
            Browse, buy, and manage digital products — all from one place, built for speed and simplicity.
          </p>
        </div>

        <div className="relative z-10 space-y-3">
          <div className="auth-feature-pill"><span className="auth-feature-dot" />Instant digital delivery</div>
          <div className="auth-feature-pill"><span className="auth-feature-dot" />Secure wallet & payments</div>
          <div className="auth-feature-pill"><span className="auth-feature-dot" />24/7 order tracking</div>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-8 py-10 bg-white">
        <div className="w-full" style={{ maxWidth: '340px' }}>

          {/* Heading */}
          <div className="mb-8 auth-reveal auth-reveal-1">
            <h2 className="auth-heading font-bold text-gray-900 leading-tight" style={{ fontSize: '1.5rem' }}>
              Welcome back
            </h2>
            <p className="text-sm text-gray-400 mt-1 font-light">
              <span className="font-semibold text-primary-600">{env.appName}</span> — good to see you again.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-7">

            {/* Email */}
            <div className="auth-reveal auth-reveal-2">
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email" name="email" type="email" required
                  className="auth-input"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <span className="auth-input-bar" />
              </div>
            </div>

            {/* Password */}
            <div className="auth-reveal auth-reveal-3">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs font-medium text-primary-500 hover:text-primary-600 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password" name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="auth-input"
                  style={{ paddingRight: '28px' }}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <span className="auth-input-bar" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  {showPassword ? <HiEyeOff className="w-4 h-4" /> : <HiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="auth-reveal auth-reveal-4 pt-1">
              <button type="submit" disabled={isLoading} className="auth-btn">
                {isLoading ? 'Signing in…' : 'Sign In →'}
              </button>
            </div>

            {/* Register link */}
            <div className="auth-reveal auth-reveal-5 text-center">
              <p className="text-sm text-gray-400">
                No account yet?{' '}
                <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                  Create one
                </Link>
              </p>
            </div>

          </form>
        </div>
      </div>

    </div>
  );
};

export default Login;
