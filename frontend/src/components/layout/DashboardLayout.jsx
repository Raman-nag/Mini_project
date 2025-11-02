import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  UserCircleIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  WifiIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import ThemeToggle from '../common/ThemeToggle';
import WalletConnection from '../wallet/WalletConnection';

const DashboardLayout = ({ children, userRole, userProfile, walletAddress, networkStatus }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Role-specific navigation items
  const getNavigationItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: `/${userRole}/dashboard`, icon: 'HomeIcon' },
    ];

    switch (userRole) {
      case 'hospital':
        return [
          ...baseItems,
          { name: 'Doctors', href: '/hospital/doctors', icon: 'UserGroupIcon' },
          { name: 'Patients', href: '/hospital/patients', icon: 'HeartIcon' },
          { name: 'Records', href: '/hospital/records', icon: 'DocumentTextIcon' },
          { name: 'Analytics', href: '/hospital/analytics', icon: 'ChartBarIcon' },
          { name: 'Settings', href: '/hospital/settings', icon: 'Cog6ToothIcon' }
        ];
      case 'doctor':
        return [
          ...baseItems,
          { name: 'My Patients', href: '/doctor/patients', icon: 'HeartIcon' },
          { name: 'Create Record', href: '/doctor/create-record', icon: 'PlusIcon' },
          { name: 'Records', href: '/doctor/records', icon: 'DocumentTextIcon' },
          { name: 'Prescriptions', href: '/doctor/prescriptions', icon: 'ClipboardDocumentListIcon' },
          { name: 'Schedule', href: '/doctor/schedule', icon: 'CalendarIcon' },
          { name: 'Settings', href: '/doctor/settings', icon: 'Cog6ToothIcon' }
        ];
      case 'patient':
        return [
          ...baseItems,
          { name: 'Medical History', href: '/patient/history', icon: 'DocumentTextIcon' },
          { name: 'Prescriptions', href: '/patient/prescriptions', icon: 'ClipboardDocumentListIcon' },
          { name: 'Grant Access', href: '/patient/grant-access', icon: 'KeyIcon' },
          { name: 'Appointments', href: '/patient/appointments', icon: 'CalendarIcon' },
          { name: 'Settings', href: '/patient/settings', icon: 'Cog6ToothIcon' }
        ];
      default:
        return baseItems;
    }
  };

  const navigationItems = getNavigationItems();

  // Mock notifications data
  const notifications = [
    {
      id: 1,
      title: 'New Patient Record',
      message: 'Dr. Smith created a new record for John Doe',
      time: '2 minutes ago',
      type: 'info'
    },
    {
      id: 2,
      title: 'Access Request',
      message: 'City Hospital requested access to your records',
      time: '1 hour ago',
      type: 'warning'
    },
    {
      id: 3,
      title: 'Prescription Ready',
      message: 'Your prescription for medication is ready',
      time: '3 hours ago',
      type: 'success'
    }
  ];

  const getNetworkStatusColor = () => {
    switch (networkStatus) {
      case 'connected':
        return 'text-green-500';
      case 'disconnected':
        return 'text-red-500';
      case 'connecting':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  const getNetworkStatusIcon = () => {
    switch (networkStatus) {
      case 'connected':
        return <WifiIcon className="h-4 w-4" />;
      case 'disconnected':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'connecting':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>;
      default:
        return <WifiIcon className="h-4 w-4" />;
    }
  };

  const handleLogout = () => {
    // Clear user session and redirect to login
    navigate('/login');
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <h1 className="text-xl font-bold text-gray-900">
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Dashboard
                </h1>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {navigationItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`${
                        isActive
                          ? 'bg-blue-100 text-blue-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                    >
                      <span className="mr-3">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1">
            <div className="flex items-center h-16 flex-shrink-0 px-4 bg-white border-b border-gray-200">
              <h1 className="text-lg font-semibold text-gray-900">
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Dashboard
              </h1>
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto">
              <nav className="flex-1 px-2 py-4 bg-white space-y-1">
                {navigationItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`${
                        isActive
                          ? 'bg-blue-100 text-blue-900 border-r-2 border-blue-500'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center px-2 py-2 text-sm font-medium rounded-l-md transition-colors duration-200`}
                    >
                      <span className="mr-3">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top header */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white dark:bg-slate-800 shadow border-b border-slate-200 dark:border-slate-700">
          <button
            className="px-4 border-r border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full text-slate-400 dark:text-slate-500 focus-within:text-slate-600 dark:focus-within:text-slate-300">
                  <div className="flex items-center h-full">
                    <span className="text-lg font-medium text-slate-900 dark:text-slate-100">
                      Welcome back, {userProfile?.firstName || 'User'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="ml-4 flex items-center md:ml-6">
              {/* Wallet Connection */}
              <div className="flex items-center mr-4">
                <WalletConnection />
              </div>

              {/* Theme Toggle */}
              <div className="flex items-center mr-4">
                <ThemeToggle variant="button" size="md" />
              </div>

              {/* Network Status - Hidden when wallet is connected (wallet shows this) */}
              <div className="hidden items-center mr-4">
                <div className={`flex items-center ${getNetworkStatusColor()}`}>
                  {getNetworkStatusIcon()}
                  <span className="ml-1 text-sm font-medium capitalize">
                    {networkStatus || 'Unknown'}
                  </span>
                </div>
              </div>

              {/* Notifications */}
              <div className="relative">
                <button
                  className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                >
                  <BellIcon className="h-6 w-6" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                      </div>
                      {notifications.map((notification) => (
                        <div key={notification.id} className="px-4 py-3 hover:bg-gray-50">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <div className={`h-2 w-2 rounded-full ${
                                notification.type === 'success' ? 'bg-green-400' :
                                notification.type === 'warning' ? 'bg-yellow-400' :
                                'bg-blue-400'
                              }`} />
                            </div>
                            <div className="ml-3 flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-500">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {notification.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile dropdown */}
              <div className="ml-3 relative">
                <div>
                  <button
                    className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => setProfileOpen(!profileOpen)}
                  >
                    <div className="flex items-center">
                      <div className="bg-blue-500 text-white rounded-full p-2 mr-2">
                        <UserCircleIcon className="h-6 w-6" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-medium text-gray-900">
                          {userProfile?.firstName} {userProfile?.lastName}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'No wallet'}
                        </div>
                      </div>
                      <ChevronDownIcon className="ml-2 h-4 w-4 text-gray-400" />
                    </div>
                  </button>
                </div>

                {profileOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      <Link
                        to={`/${userRole}/settings`}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Cog6ToothIcon className="mr-3 h-4 w-4" />
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
