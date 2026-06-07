import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import { env } from '../../config/env';
import {
  HiMenu,
  HiX,
  HiOutlineShoppingCart,
  HiOutlineCreditCard,
  HiOutlineKey,
  HiOutlineShieldCheck,
  HiOutlineClock,
  HiOutlineGlobe,
  HiOutlineLockClosed,
  HiOutlineChartBar,
  HiOutlineUserGroup,
  HiOutlinePhone,
  HiOutlineUserAdd,
  HiOutlineSearch,
  HiOutlineArrowRight,
} from 'react-icons/hi';
import { MdSpeed } from 'react-icons/md';

const Home = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getDashboardRoute = () => {
    if (user?.role === 'admin') {
      return '/admin/dashboard';
    }
    return '/user/dashboard';
  };

  const features = [
    {
      icon: HiOutlineShoppingCart,
      title: 'Massive Catalog',
      description: 'Access thousands of premium digital solutions from entertainment to professional software tools.',
    },
    {
      icon: HiOutlineCreditCard,
      title: 'Safe Checkout',
      description: 'Multi-layer security with encrypted transactions and trusted payment gateways.',
    },
    {
      icon: HiOutlineKey,
      title: 'Instant Activation',
      description: 'Receive all credentials and access links immediately in your inbox.',
    },
    {
      icon: HiOutlineShieldCheck,
      title: 'Quality Assured',
      description: 'Every product undergoes strict verification for authenticity and functionality.',
    },
    {
      icon: MdSpeed,
      title: 'Lightning Fast',
      description: 'Automated system ensures seamless processing from order to activation.',
    },
    {
      icon: HiOutlineClock,
      title: 'Always Available',
      description: 'Dedicated support team ready to help anytime, anywhere.',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Register Account',
      description: 'Quick registration process with email verification to secure your account.',
      icon: HiOutlineUserAdd,
    },
    {
      number: '02',
      title: 'Explore Marketplace',
      description: 'Search and discover thousands of digital products tailored to your needs.',
      icon: HiOutlineSearch,
    },
    {
      number: '03',
      title: 'Complete Payment',
      description: 'Choose your payment method and finalize your secure transaction.',
      icon: HiOutlineCreditCard,
    },
    {
      number: '04',
      title: 'Download & Enjoy',
      description: 'Get instant access to your purchased items with full support.',
      icon: HiOutlineKey,
    },
  ];

  const benefits = [
    {
      icon: HiOutlineLockClosed,
      title: 'Enterprise Security',
      description: 'Bank-level encryption protects all your personal and financial information.',
    },
    {
      icon: HiOutlineGlobe,
      title: 'Worldwide Availability',
      description: 'Shop from any location without restrictions or regional limitations.',
    },
    {
      icon: HiOutlineChartBar,
      title: 'Unbeatable Value',
      description: 'Get premium products at competitive rates with exclusive deals.',
    },
    {
      icon: HiOutlineUserGroup,
      title: 'Trusted by Millions',
      description: 'Join a thriving community of satisfied users worldwide.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white border-b border-gray-200'
            : 'bg-white/95 backdrop-blur-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center group">
              <span className="text-lg sm:text-xl font-bold text-primary-600 tracking-tight hover:text-primary-700 transition-colors">
                {env.appName}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">
                Features
              </a>
              <a href="#how-it-works" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">
                How It Works
              </a>
              <a href="#benefits" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">
                Benefits
              </a>
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <Link
                    to={getDashboardRoute()}
                    className="px-4 py-2 text-gray-700 hover:text-primary-600 transition-colors font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to={getDashboardRoute()}
                    className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-all"
                  >
                    Go to Dashboard
                  </Link>
                </>
              ) : (
                <>
                  {env.telegramBotUrl && (
                    <a
                      href={env.telegramBotUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-all"
                    >
                      Open Telegram App
                    </a>
                  )}
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? (
                <HiX className="w-6 h-6" />
              ) : (
                <HiMenu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 pt-2 pb-4 space-y-2">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                How It Works
              </a>
              <a
                href="#benefits"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Benefits
              </a>
              <div className="pt-4 border-t border-gray-200 space-y-2">
                {isAuthenticated ? (
                    <Link
                      to={getDashboardRoute()}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-center px-4 py-2.5 bg-primary-600 text-white rounded-lg font-semibold"
                    >
                      Go to Dashboard
                    </Link>
                ) : (
                  <>
                    {env.telegramBotUrl && (
                      <a
                        href={env.telegramBotUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block w-full text-center px-4 py-2.5 bg-primary-600 text-white rounded-lg font-semibold"
                      >
                        Open Telegram App
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 sm:pt-28 lg:pt-44 pb-16 sm:pb-20 lg:pb-32 overflow-hidden bg-white">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-white -z-20" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-15 -z-10" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left lg:col-span-7">
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 text-xs sm:text-sm font-semibold mb-6 border border-primary-200">
                Discover Premium Content
              </span>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-6 tracking-tight">
                Unlock Your
                <span className="block text-primary-600 mt-1">
                  Digital World
                </span>
              </h1>
              
              <p className="text-sm sm:text-base text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Explore premium digital products and streaming services. Instant delivery, lifetime access, complete security.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-10">
                {isAuthenticated ? (
                  <Link
                    to={getDashboardRoute()}
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold text-sm hover:bg-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Browse Products
                  </Link>
                ) : (
                  <>
                    {env.telegramBotUrl && (
                      <a
                        href={env.telegramBotUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold text-sm hover:bg-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        Open Telegram Mini App
                      </a>
                    )}
                  </>
                )}
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-5 sm:pt-8 border-t border-gray-200">
                <div className="text-center sm:text-left">
                  <div className="text-xl sm:text-3xl font-extrabold text-primary-600">8000+</div>
                  <div className="text-xs sm:text-sm text-gray-600 mt-1.5 sm:mt-2">Products</div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-xl sm:text-3xl font-extrabold text-primary-600">150K+</div>
                  <div className="text-xs sm:text-sm text-gray-600 mt-1.5 sm:mt-2">Users</div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-xl sm:text-3xl font-extrabold text-primary-600">100%</div>
                  <div className="text-xs sm:text-sm text-gray-600 mt-1.5 sm:mt-2">Secure</div>
                </div>
              </div>
            </div>
            
            {/* Right Content - Image */}
            <div className="relative mt-12 lg:mt-0 w-full lg:col-span-5">
              <div className="relative rounded-3xl overflow-hidden">
                {/* Gradient Border */}
                <div className="absolute -inset-1 bg-gradient-to-br from-primary-300 to-primary-600 rounded-3xl opacity-30 blur-xl" />
                
                {/* Image Container */}
                <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary-50 to-gray-100 shadow-2xl border border-primary-100">
                  <img
                    src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=800&fit=crop&q=80"
                    alt="Digital Products Platform"
                    className="w-full h-auto object-cover rounded-3xl aspect-square"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 lg:py-24 bg-white relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-white -z-20" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-10 -z-10" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 text-xs sm:text-sm font-semibold mb-4 border border-primary-200">
              Why We Stand Out
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
              Powerful Features for <span className="text-primary-600">Your Success</span>
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
              Discover what makes our platform the go-to choice for millions seeking quality digital products.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="group relative">
                  {/* Feature Card */}
                  <div className="relative bg-white rounded-2xl p-6 sm:p-8 border-2 border-gray-100 hover:border-primary-300 transition-all duration-300 hover:shadow-xl">
                    {/* Background gradient on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-50/0 to-primary-50/0 group-hover:from-primary-50/30 group-hover:to-primary-50/10 rounded-2xl transition-all duration-300" />
                    
                    {/* Content */}
                    <div className="relative">
                      {/* Icon */}
                      <div className="relative mb-4 sm:mb-6 inline-block">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 shadow-lg group-hover:shadow-xl">
                          <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                        </div>
                      </div>
                      
                      {/* Title and Description */}
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 group-hover:text-primary-600 transition-colors duration-300">{feature.title}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-12 lg:py-16 bg-gray-50 relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 text-xs sm:text-sm font-semibold mb-4 border border-primary-200">
              Easy Steps
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
              Get Started in <span className="text-primary-600">4 Simple Steps</span>
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
              From signup to instant access in minutes. Our streamlined process makes it effortless to start.
            </p>
          </div>
          
          {/* Desktop: Horizontal Timeline */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Connecting line */}
              <div className="absolute top-24 left-0 right-0 h-0.5 bg-gray-300" />
              
              <div className="grid grid-cols-4 gap-8 relative">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={index} className="relative">
                      {/* Step Card */}
                      <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 transition-all duration-300 hover:border-primary-600">
                        {/* Icon Circle */}
                        <div className="relative mb-4 sm:mb-6">
                          <div className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-primary-600 flex items-center justify-center transform hover:scale-110 transition-transform duration-300`}>
                            <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                          </div>
                          {/* Step Number Badge */}
                          <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-full border-2 border-gray-300 flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-700">{step.number}</span>
                          </div>
                        </div>
                        
                        {/* Content */}
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 text-center">{step.title}</h3>
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed text-center">{step.description}</p>
                      </div>
                      
                      {/* Arrow connector */}
                      {index < steps.length - 1 && (
                        <div className="absolute top-24 -right-4 transform translate-x-1/2 z-10">
                          <div className={`w-10 h-10 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center`}>
                            <HiOutlineArrowRight className="w-5 h-5 text-primary-600" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mobile/Tablet: Vertical Cards */}
          <div className="lg:hidden space-y-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative">
                  <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 flex items-start space-x-4">
                    {/* Icon Circle */}
                    <div className="flex-shrink-0">
                      <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-primary-600 flex items-center justify-center`}>
                        <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                      </div>
                      {/* Step Number */}
                      <div className="mt-1.5 sm:mt-2 text-center">
                        <span className="text-xs font-bold text-gray-500">{step.number}</span>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 pt-1">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">{step.title}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                  
                  {/* Connector Arrow */}
                  {index < steps.length - 1 && (
                    <div className="flex justify-center my-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <HiOutlineArrowRight className="w-5 h-5 text-primary-600 rotate-90" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-12 lg:py-16 bg-white relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 text-xs sm:text-sm font-semibold mb-4 border border-primary-200">
              Core Advantages
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
              Why Join <span className="text-primary-600">Our Community</span>
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
              Experience unmatched reliability, security, and value that millions of users depend on daily.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={index}
                  className="group relative bg-gray-50 rounded-2xl p-8 border-2 border-transparent hover:border-primary-600 transition-all duration-300"
                >
                  {/* Icon */}
                  <div className="relative mb-4 sm:mb-6">
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 bg-primary-600 rounded-2xl flex items-center justify-center group-hover:bg-primary-700 transition-colors duration-300">
                      <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="relative">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 group-hover:text-primary-600 transition-colors duration-300">
                      {benefit.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 lg:py-16 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4 sm:mb-6">
            Ready to Unlock Premium Digital Products?
          </h2>
          <p className="text-sm sm:text-base text-primary-100 mb-6 sm:mb-8">
            Join thousands of satisfied users enjoying instant access to premium digital content and services.
          </p>
          {isAuthenticated ? (
            <Link
              to={getDashboardRoute()}
              className="inline-flex items-center space-x-2 px-6 py-2.5 bg-white text-primary-600 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-all"
            >
              <span>Go to Dashboard</span>
            </Link>
          ) : (
            <Link
              to="/register"
              className="inline-flex items-center space-x-2 px-6 py-2.5 bg-white text-primary-600 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-all"
            >
              <span>Create Free Account</span>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary-900 text-gray-300 border-t-2 border-primary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-lg font-bold text-white">{env.appName.charAt(0).toUpperCase()}</span>
                </div>
                <span className="text-base sm:text-lg font-bold text-white">{env.appName}</span>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed">
                Your trusted platform for purchasing premium digital products and subscriptions.
              </p>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Support</h3>
              <ul className="space-y-2">
                <li>
                  <a href="mailto:support@darknet.com" className="hover:text-primary-400 transition-colors text-sm flex items-center space-x-2">

                    <span>support@darknet.com</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary-400 transition-colors text-sm flex items-center space-x-2">
                    <HiOutlinePhone className="w-4 h-4" />
                    <span>24/7 Customer Support</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary-400 transition-colors text-sm">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary-400 transition-colors text-sm">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="hover:text-primary-400 transition-colors text-sm">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary-400 transition-colors text-sm">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary-400 transition-colors text-sm">
                    Refund Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary-400 transition-colors text-sm">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-primary-800 pt-8 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-sm text-gray-400">
                © {new Date().getFullYear()} {env.appName}. All rights reserved.
              </p>
              <div className="flex items-center space-x-6">
                <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors text-sm">
                  Twitter
                </a>
                <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors text-sm">
                  Facebook
                </a>
                <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors text-sm">
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
