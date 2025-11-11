import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';
import { Web3Provider } from '../contexts/Web3Context';
import { IPFSProvider } from '../contexts/IPFSContext';
import { ToastProvider } from '../contexts/ToastContext';
import ErrorBoundary from '../components/common/ErrorBoundary';

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
const AddDoctor = lazy(() => import('../pages/hospital/AddDoctorPage'));
const DoctorList = lazy(() => import('../components/hospital/DoctorList'));
const PatientList = lazy(() => import('../components/hospital/PatientList'));
const HospitalAnalytics = lazy(() => import('../pages/HospitalAnalytics'));
const DoctorDashboard = lazy(() => import('../pages/DoctorDashboard'));
const CreateRecord = lazy(() => import('../components/doctor/CreateRecord'));
const MyPatients = lazy(() => import('../components/doctor/MyPatients'));
const PrescriptionForm = lazy(() => import('../components/doctor/PrescriptionForm'));
const DoctorPrescriptions = lazy(() => import('../components/doctor/DoctorPrescriptions'));
const ViewPatientHistory = lazy(() => import('../components/doctor/ViewPatientHistory'));
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
    <ErrorBoundary>
      <ThemeProvider>
        <Web3Provider>
          <IPFSProvider>
            <ToastProvider>
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
                {/* Hospital subpages */}
                <Route
                  path="/hospital/add-doctor"
                  element={
                    <DashboardLayout>
                      <RouteWrapper>
                        <AddDoctor />
                      </RouteWrapper>
                    </DashboardLayout>
                  }
                />
                <Route
                  path="/hospital/doctors"
                  element={
                    <DashboardLayout>
                      <RouteWrapper>
                        <DoctorList />
                      </RouteWrapper>
                    </DashboardLayout>
                  }
                />
                <Route
                  path="/hospital/patients"
                  element={
                    <DashboardLayout>
                      <RouteWrapper>
                        <PatientList />
                      </RouteWrapper>
                    </DashboardLayout>
                  }
                />
                <Route
                  path="/hospital/analytics"
                  element={
                    <DashboardLayout>
                      <RouteWrapper>
                        <HospitalAnalytics />
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
                {/* Doctor subpages */}
                <Route
                  path="/doctor/create-record"
                  element={
                    <DashboardLayout>
                      <RouteWrapper>
                        <CreateRecord />
                      </RouteWrapper>
                    </DashboardLayout>
                  }
                />
                <Route
                  path="/doctor/my-patients"
                  element={
                    <DashboardLayout>
                      <RouteWrapper>
                        <MyPatients />
                      </RouteWrapper>
                    </DashboardLayout>
                  }
                />
                <Route
                  path="/doctor/write-prescription"
                  element={
                    <DashboardLayout>
                      <RouteWrapper>
                        <PrescriptionForm />
                      </RouteWrapper>
                    </DashboardLayout>
                  }
                />
                <Route
                  path="/doctor/prescriptions"
                  element={
                    <DashboardLayout>
                      <RouteWrapper>
                        <DoctorPrescriptions />
                      </RouteWrapper>
                    </DashboardLayout>
                  }
                />
                <Route
                  path="/doctor/patient-history/:patientId"
                  element={
                    <DashboardLayout>
                      <RouteWrapper>
                        <ViewPatientHistory />
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
            </ToastProvider>
          </IPFSProvider>
        </Web3Provider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default AppRouter;

