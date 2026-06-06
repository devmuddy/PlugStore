import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/api/authService';
import { env } from '../../config/env';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
      toast.success('Reset instructions sent to your email.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-red-50/40 auth-root">
      <div className="w-full max-w-lg mx-auto px-4 py-10">

        {sent ? (
          /* ── Success state ── */
          <div>
            <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">Check your inbox</h3>
            <p className="text-xs text-gray-400 mb-5">
              We sent reset instructions to <span className="text-gray-600 font-medium">{email}</span>.
            </p>
            <Link to="/login" className="text-xs font-semibold text-primary-600 hover:text-primary-700">Back to sign in</Link>
          </div>
        ) : (
          <>
            {/* Brand */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-primary-600">{env.appName}</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Email</label>
                <input
                  type="email" required
                  className="w-full px-4 py-3 text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none placeholder:text-gray-400"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-base font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>

            {/* Footer */}
            <p className="text-sm text-gray-400 text-center mt-6">
              <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">Back to sign in</Link>
            </p>
          </>
        )}

      </div>
    </div>
  );
};

export default ForgotPassword;
