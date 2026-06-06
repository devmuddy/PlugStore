import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { setCredentials, setLoading } from '../../store/slices/authSlice';
import { authService } from '../../services/api/authService';
import type { RegisterData } from '../../types';
import { env } from '../../config/env';
import toast from 'react-hot-toast';
import { HiEye, HiEyeOff } from 'react-icons/hi';

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);
  const [formData, setFormData] = useState<RegisterData>({ email: '', password: '', username: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username?.trim()) { toast.error('Username is required'); return; }
    if (formData.username.trim().length < 3) { toast.error('Username must be at least 3 characters'); return; }
    if (formData.password !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (formData.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }

    dispatch(setLoading(true));
    try {
      const response = await authService.register(formData);
      dispatch(setCredentials(response));
      toast.success('Account created successfully!');
      navigate('/user/dashboard', { replace: true });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="min-h-screen flex auth-root">

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
            Join the<br />
            <span style={{ color: '#fca5a5' }}>community</span><br />
            today.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: '1.7', maxWidth: '300px' }}>
            Create your free account and start exploring thousands of digital products in minutes.
          </p>
        </div>

        <div className="relative z-10 space-y-3">
          <div className="auth-feature-pill"><span className="auth-feature-dot" />Free to join, no hidden fees</div>
          <div className="auth-feature-pill"><span className="auth-feature-dot" />Instant access after signup</div>
          <div className="auth-feature-pill"><span className="auth-feature-dot" />Secure & private by default</div>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-8 py-10 bg-white">
        <div className="w-full" style={{ maxWidth: '340px' }}>

          {/* Heading */}
          <div className="mb-8 auth-reveal auth-reveal-1">
            <h2 className="auth-heading font-bold text-gray-900 leading-tight" style={{ fontSize: '1.5rem' }}>
              Create account
            </h2>
            <p className="text-sm text-gray-400 mt-1 font-light">
              <span className="font-semibold text-primary-600">{env.appName}</span> — fill in your details to get started.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Username */}
            <div className="auth-reveal auth-reveal-2">
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                Username
              </label>
              <div className="relative">
                <input
                  id="username" name="username" type="text" required
                  className="auth-input"
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
                <span className="auth-input-bar" />
              </div>
            </div>

            {/* Email */}
            <div className="auth-reveal auth-reveal-3">
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
            <div className="auth-reveal auth-reveal-4">
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                Password
              </label>
              <div className="relative">
                <input
                  id="password" name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="auth-input"
                  style={{ paddingRight: '28px' }}
                  placeholder="Min. 6 characters"
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

            {/* Confirm Password */}
            <div className="auth-reveal auth-reveal-5">
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword" name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  className="auth-input"
                  style={{ paddingRight: '28px' }}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <span className="auth-input-bar" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-0 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  {showConfirmPassword ? <HiEyeOff className="w-4 h-4" /> : <HiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="auth-reveal auth-reveal-6 pt-1">
              <button type="submit" disabled={isLoading} className="auth-btn">
                {isLoading ? 'Creating account…' : 'Create Account →'}
              </button>
            </div>

            {/* Login link */}
            <div className="text-center">
              <p className="text-sm text-gray-400">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>

          </form>
        </div>
      </div>

    </div>
  );
};

export default Register;
