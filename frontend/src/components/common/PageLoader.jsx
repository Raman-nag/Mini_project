import React from 'react';
import { HeartIcon } from '@heroicons/react/24/outline';

const PageLoader = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="text-center">
        {/* Animated Logo */}
        <div className="relative mb-8">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center animate-pulse">
            <HeartIcon className="w-10 h-10 text-white animate-bounce" />
          </div>
          <div className="absolute inset-0 w-20 h-20 mx-auto bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl opacity-20 animate-ping"></div>
        </div>
        
        {/* Loading Text */}
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Loading Multimedia EHR
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          Securing your medical data with blockchain technology
        </p>
        
        {/* Loading Animation */}
        <div className="flex justify-center space-x-2">
          <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-64 mx-auto mt-8">
          <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
            <div className="bg-gradient-to-r from-primary-500 to-primary-700 h-full rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageLoader;
