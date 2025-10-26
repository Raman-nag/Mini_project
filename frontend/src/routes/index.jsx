import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';
import { Web3Provider } from '../contexts/Web3Context';
import { IPFSProvider } from '../contexts/IPFSContext';

// Layouts
import AuthLayout from '../components/layout/AuthLayout';
import DashboardLayout from '../components/layout/DashboardLayout';
import PublicLayout from '../components/layout/PublicLayout';

// Loading Components
import PageLoader from '../components/common/PageLoader';
import SkeletonLoader from '../components/common/SkeletonLoader';

// Lazy load pages for better performance
const Home = lazy(() => import('../pages/Home'));
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const HospitalDashboard = lazy(() => import('../pages/HospitalDashboard'));
const DoctorDashboard = lazy(() => import('../pages/DoctorDashboard'));
const PatientDashboard = lazy(() => import('../pages/PatientDashboard'));
const NotFound = lazy(() => import('../pages/NotFound'));

// Route wrapper with loading states
const RouteWrapper = ({ children, showSkeleton = false }) => (
  <Suspense fallback={showSkeleton ? <SkeletonLoader /> : <PageLoader />}>
    {children}
  </Suspense>
);

// Main App Router
const AppRouter = () => {
  return (
    <ThemeProvider>
      <Web3Provider>
        <IPFSProvider>
          <AuthProvider>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
              <Routes>
                {/* Public Routes */}
                <Route 
                  path="/" 
                  element={
                    <PublicLayout>
                      <RouteWrapper>
                        <Home />
                      </RouteWrapper>
                    </PublicLayout>
                  } 
                />
                
                {/* Authentication Routes */}
                <Route 
                  path="/login" 
                  element={
                    <AuthLayout>
                      <RouteWrapper showSkeleton>
                        <Login />
                      </RouteWrapper>
                    </AuthLayout>
                  } 
                />
                <Route 
                  path="/register" 
                  element={
                    <AuthLayout>
                      <RouteWrapper showSkeleton>
                        <Register />
                      </RouteWrapper>
                    </AuthLayout>
                  } 
                />
                
                {/* Dashboard Routes */}
                <Route 
                  path="/hospital/dashboard" 
                  element={
                    <DashboardLayout>
                      <RouteWrapper showSkeleton>
                        <HospitalDashboard />
                      </RouteWrapper>
                    </DashboardLayout>
                  } 
                />
                <Route 
                  path="/doctor/dashboard" 
                  element={
                    <DashboardLayout>
                      <RouteWrapper showSkeleton>
                        <DoctorDashboard />
                      </RouteWrapper>
                    </DashboardLayout>
                  } 
                />
                <Route 
                  path="/patient/dashboard" 
                  element={
                    <DashboardLayout>
                      <RouteWrapper showSkeleton>
                        <PatientDashboard />
                      </RouteWrapper>
                    </DashboardLayout>
                  } 
                />
                
                {/* Legacy redirects for backward compatibility */}
                <Route path="/hospital-dashboard" element={<Navigate to="/hospital/dashboard" replace />} />
                <Route path="/doctor-dashboard" element={<Navigate to="/doctor/dashboard" replace />} />
                <Route path="/patient-dashboard" element={<Navigate to="/patient/dashboard" replace />} />
                
                {/* 404 Route */}
                <Route 
                  path="*" 
                  element={
                    <PublicLayout>
                      <RouteWrapper>
                        <NotFound />
                      </RouteWrapper>
                    </PublicLayout>
                  } 
                />
              </Routes>
            </div>
          </AuthProvider>
        </IPFSProvider>
      </Web3Provider>
    </ThemeProvider>
  );
};

export default AppRouter;

