import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { Web3Provider } from './contexts/Web3Context'
import { IPFSProvider } from './contexts/IPFSContext'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import PatientDashboard from './pages/PatientDashboard'
import DoctorDashboard from './pages/DoctorDashboard'
import HospitalDashboard from './pages/HospitalDashboard'
import NotFound from './pages/NotFound'

// Layouts
import AuthLayout from './components/layout/AuthLayout'
import DashboardLayout from './components/layout/DashboardLayout'

// Loading component
import Loader from './components/common/Loader'

function App() {
  return (
    <ThemeProvider>
      <Web3Provider>
        <IPFSProvider>
          <AuthProvider>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                
                {/* Auth routes */}
                <Route path="/login" element={
                  <AuthLayout>
                    <Login />
                  </AuthLayout>
                } />
                <Route path="/register" element={
                  <AuthLayout>
                    <Register />
                  </AuthLayout>
                } />
                
                {/* Dashboard routes */}
                <Route path="/patient-dashboard" element={
                  <DashboardLayout>
                    <PatientDashboard />
                  </DashboardLayout>
                } />
                <Route path="/doctor-dashboard" element={
                  <DashboardLayout>
                    <DoctorDashboard />
                  </DashboardLayout>
                } />
                <Route path="/hospital-dashboard" element={
                  <DashboardLayout>
                    <HospitalDashboard />
                  </DashboardLayout>
                } />
                
                {/* 404 route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </AuthProvider>
        </IPFSProvider>
      </Web3Provider>
    </ThemeProvider>
  )
}

export default App
