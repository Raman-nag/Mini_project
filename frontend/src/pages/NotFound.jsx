import React from 'react';
import { Link } from 'react-router-dom';
import { 
  HomeIcon, 
  ArrowLeftIcon, 
  HeartIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800/25 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"></div>
      
      <div className="relative max-w-2xl mx-auto text-center">
        {/* 404 Illustration */}
        <div className="relative mb-8">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center shadow-2xl">
            <ExclamationTriangleIcon className="w-16 h-16 text-white" />
          </div>
          {/* Floating elements */}
          <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-bounce"></div>
          <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute top-1/2 -right-8 w-6 h-6 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Error Content */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-6xl font-bold text-slate-900 dark:text-slate-100">
              404
            </h1>
            <h2 className="text-3xl font-semibold text-slate-700 dark:text-slate-300">
              Page Not Found
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Oops! The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          {/* Search Suggestion */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <MagnifyingGlassIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Looking for something specific?
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <Link
                to="/"
                className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
              >
                Home Page
              </Link>
              <Link
                to="/login"
                className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
              >
                Register
              </Link>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="group inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <HomeIcon className="w-5 h-5 mr-2" />
              Go Home
            </Link>
            <button
              onClick={() => window.history.back()}
              className="group inline-flex items-center justify-center px-6 py-3 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-300"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Go Back
            </button>
          </div>

          {/* Help Section */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <HeartIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                Need Help?
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              If you believe this is an error, please contact our support team.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center text-sm">
              <a
                href="mailto:support@multimediaehr.com"
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              >
                raman.nag.n@gmail.com
              </a>
              <span className="hidden sm:inline text-slate-400 dark:text-slate-500">•</span>
              <a
                href="tel:+1-555-HELP"
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              >
                +91 7411 978 258 HELP
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © 2025 Multimedia EHR. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

