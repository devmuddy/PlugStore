import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/api/authService';
import { env } from '../../config/env';
import toast from 'react-hot-toast';
import { HiCheckCircle, HiXCircle } from 'react-icons/hi';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const token = searchParams.get('token');
  const hasVerified = useRef(false);
  const miniAppLoginUrl = env.telegramBotUrl || 'https://adah-investigable-overcautiously.ngrok-free.dev/login';

  useEffect(() => {
    // Prevent duplicate verification calls
    if (hasVerified.current) {
      return;
    }

    const verifyEmail = async () => {
      if (!token) {
        toast.error('Invalid verification link');
        setVerifying(false);
        return;
      }

      hasVerified.current = true;

      try {
        await authService.verifyEmail(token);
        toast.success('Email verified successfully!');
        setVerified(true);
        // Redirect verified users to Mini App login entry.
        setTimeout(() => {
          window.location.href = miniAppLoginUrl;
        }, 2000);
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Email verification failed. The link may have expired.');
        setVerified(false);
      } finally {
        setVerifying(false);
      }
    };

    verifyEmail();
  }, [miniAppLoginUrl, token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50/60 via-red-50/20 to-red-50/60 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="p-4 sm:p-8">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 text-left mb-2">
              Verify Email
            </h2>
            <p className="text-xs text-gray-500 text-left">
              Verifying your {env.appName} account
            </p>
          </div>

          <div className="space-y-6">
            {verifying ? (
              <>
                {/* Loading State */}
                <div className="flex justify-center mb-6">
                  <div className="rounded-full bg-primary-100 p-4">
                    <svg className="animate-spin h-12 w-12 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-700">
                    Verifying your email address...
                  </p>
                </div>
              </>
            ) : verified ? (
              <>
                {/* Success State */}
                <div className="flex justify-center mb-6">
                  <div className="rounded-full bg-green-100 p-4">
                    <HiCheckCircle className="h-12 w-12 text-green-600" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    Email Verified Successfully!
                  </p>
                  <p className="text-xs text-gray-500 mb-6">
                    Your {env.appName} account has been verified. Redirecting to Mini App...
                  </p>
                </div>
                <div className="text-center">
                  <a
                    href={miniAppLoginUrl}
                    className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
                  >
                    Open Mini App
                    <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </>
            ) : (
              <>
                {/* Error State */}
                <div className="flex justify-center mb-6">
                  <div className="rounded-full bg-red-100 p-4">
                    <HiXCircle className="h-12 w-12 text-red-600" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    Verification Failed
                  </p>
                  <p className="text-xs text-gray-500 mb-6">
                    The verification link is invalid or has expired. Please request a new verification email.
                  </p>
                </div>
                <div className="space-y-4">
                  <Link
                    to="/register"
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all"
                  >
                    Register Again
                  </Link>
                  <div className="text-center">
                    <Link
                      to="/login"
                      className="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
                    >
                      Back to login
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
