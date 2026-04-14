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
    <div className="min-h-screen flex auth-root">

      {/* ── LEFT PANEL ─────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[48%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1e3a8a 60%, #1d4ed8 100%)' }}
      >
        <div className="absolute inset-0 auth-dot-grid pointer-events-none" />
        <div className="auth-orb-1 absolute -top-24 -right-24 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.25) 0%, transparent 70%)' }} />
        <div className="auth-orb-2 absolute bottom-32 -left-20 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)' }} />
        <div className="auth-orb-3 absolute top-1/2 right-10 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(147,197,253,0.15) 0%, transparent 70%)' }} />

        <div className="relative z-10">
          <h1 className="auth-heading text-white font-extrabold leading-tight mb-5 mt-4"
            style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)' }}>
            Locked out?<br />
            <span style={{ color: '#93c5fd' }}>We've got</span><br />
            you covered.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: '1.7', maxWidth: '300px' }}>
            Enter your email and we'll send you a link to reset your password — no fuss, no wait.
          </p>
        </div>

        <div className="relative z-10 space-y-3">
          <div className="auth-feature-pill"><span className="auth-feature-dot" />Secure reset link via email</div>
          <div className="auth-feature-pill"><span className="auth-feature-dot" />Link expires in 1 hour</div>
          <div className="auth-feature-pill"><span className="auth-feature-dot" />No password stored in plain text</div>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-8 py-10 bg-white">
        <div className="w-full" style={{ maxWidth: '340px' }}>

          {sent ? (
            /* ── Success state ── */
            <div className="auth-reveal auth-reveal-1 text-center">
              <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-5">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z" stroke="#2563eb" strokeWidth="1.8"/>
                  <path d="M2 6l10 7 10-7" stroke="#2563eb" strokeWidth="1.8" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="auth-heading font-bold text-gray-900 mb-2" style={{ fontSize: '1.4rem' }}>
                Check your inbox
              </h2>
              <p className="text-sm text-gray-400 font-light mb-8">
                We sent reset instructions to <span className="text-gray-600 font-medium">{email}</span>.
              </p>
              <Link to="/login" className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                ← Back to sign in
              </Link>
            </div>
          ) : (
            <>
              {/* Heading */}
              <div className="mb-8 auth-reveal auth-reveal-1">
                <h2 className="auth-heading font-bold text-gray-900 leading-tight" style={{ fontSize: '1.5rem' }}>
                  Reset password
                </h2>
                <p className="text-sm text-gray-400 mt-1 font-light">
                  <span className="font-semibold text-primary-600">{env.appName}</span> — we'll email you a secure reset link.
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <span className="auth-input-bar" />
                  </div>
                </div>

                {/* Submit */}
                <div className="auth-reveal auth-reveal-3 pt-1">
                  <button type="submit" disabled={loading} className="auth-btn">
                    {loading ? 'Sending…' : 'Send Reset Link →'}
                  </button>
                </div>

                {/* Back link */}
                <div className="auth-reveal auth-reveal-4 text-center">
                  <Link to="/login" className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors">
                    ← Back to sign in
                  </Link>
                </div>

              </form>
            </>
          )}

        </div>
      </div>

    </div>
  );
};

export default ForgotPassword;
