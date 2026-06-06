import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/api/authService';
import { env } from '../../config/env';
import toast from 'react-hot-toast';
import { HiMail, HiExclamationCircle } from 'react-icons/hi';

const VerificationRequired = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email') || '';
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!email) {
      // If no email provided, redirect to login
      navigate('/login');
    }
  }, [email, navigate]);

  const handleResend = async () => {
    if (!email) {
      toast.error('Email address is required');
      return;
    }

    setResending(true);

    try {
      await authService.resendVerificationEmail(email);
      toast.success('Verification email sent successfully! Please check your inbox.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resend verification email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (!email) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50/60 via-red-50/20 to-red-50/60 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="p-4 sm:p-8">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 text-left mb-2">
              Email Verification Required
            </h2>
            <p className="text-xs text-gray-500 text-left">
              Please verify your email to access your {env.appName} account
            </p>
          </div>

          <div className="space-y-6">
            {/* Warning Icon */}
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-yellow-100 p-4">
                <HiExclamationCircle className="h-12 w-12 text-yellow-600" />
              </div>
            </div>

            {/* Message */}
            <div className="text-center">
              <p className="text-sm text-gray-700 mb-2">
                Your email address needs to be verified before you can access your account.
              </p>
              <p className="text-sm font-medium text-gray-900 mb-4">
                {email}
              </p>
              <p className="text-xs text-gray-500 mb-6">
                We've sent a verification link to your email. Please check your inbox and click the link to verify your email address.
              </p>
            </div>

            {/* Resend Button */}
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="w-full flex justify-center items-center py-3 px-4 border border-primary-300 rounded-lg text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {resending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <HiMail className="h-5 w-5 mr-2" />
                  Resend Verification Email
                </>
              )}
            </button>

            {/* Back to Login Link */}
            <div className="text-center pt-4">
              <p className="text-sm text-gray-600 mb-2">
                Already verified?{' '}
                <Link
                  to="/login"
                  className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationRequired;

