// src/routes.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import { ToastProvider } from "./contexts/ToastContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import HospitalDashboard from "./pages/HospitalDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorAnalytics from "./pages/doctor/Analytics";
import DoctorRecordsPage from "./pages/doctor/RecordsPage";
import GetPatientDetailsPage from "./pages/doctor/GetPatientDetailsPage";
import PatientDashboard from "./pages/PatientDashboard";
import NotFound from "./pages/NotFound";
import AddDoctorPage from "./pages/hospital/AddDoctorPage";
import PatientsPage from "./pages/hospital/PatientsPage";
import AnalyticsPage from "./pages/hospital/AnalyticsPage";
import DoctorsList from "./pages/hospital/DoctorsList";
// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import UsersRoles from "./pages/admin/UsersRoles";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AuditLogs from "./pages/admin/AuditLogs";
import Search from "./pages/admin/Search";
import CreateRecord from "./components/doctor/CreateRecord";
import MyPatientsPage from "./pages/doctor/MyPatientsPage";
import PrescriptionForm from "./components/doctor/PrescriptionForm";
import ViewPatientHistory from "./components/doctor/ViewPatientHistory";
import DoctorPrescriptions from "./components/doctor/DoctorPrescriptions";
import GetPatientDetails from "./components/doctor/GetPatientDetails";
import MedicalHistoryPage from "./pages/patient/MedicalHistoryPage";
import PrescriptionsPage from "./pages/patient/PrescriptionsPage";
import GrantAccessPage from "./pages/patient/GrantAccessPage";
import InsuranceRequestsPage from "./pages/patient/InsuranceRequestsPage";
import ResearchRequestsPage from "./pages/patient/ResearchRequestsPage";
// Insurance Pages
import InsuranceDashboard from "./pages/insurance/Dashboard";
import InsuranceCheckPatientData from "./pages/insurance/CheckPatientData";
import InsuranceGranted from "./pages/insurance/GrantedPatients";
import InsuranceRejected from "./pages/insurance/RejectedPatients";
import InsuranceAnalytics from "./pages/insurance/Analytics";
// Research organization pages
import ResearchDashboard from "./pages/research/Dashboard";
import ResearchCreateGroup from "./pages/research/CreateGroup";
import ResearchViewGroups from "./pages/research/ViewGroups";
import ResearchAnalytics from "./pages/research/Analytics";

export default function AppRouter() {
  return (
    <ToastProvider>
      <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/users" element={<UsersRoles />} />
      <Route path="/admin/analytics" element={<AdminAnalytics />} />
      <Route path="/admin/audit-logs" element={<AuditLogs />} />
      <Route path="/admin/search" element={<Search />} />

      {/* Hospital Routes */}
      <Route path="/hospital/dashboard" element={<HospitalDashboard />} />
      <Route path="/hospital/doctors" element={<DoctorsList />} />
      <Route path="/hospital/add-doctor" element={<AddDoctorPage />} />
      <Route path="/hospital/patients" element={<PatientsPage />} />
      <Route path="/hospital/analytics" element={<AnalyticsPage />} />
      
      <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
      {/* Doctor subpages */}
      <Route path="/doctor/analytics" element={<DoctorAnalytics />} />
      <Route path="/doctor/records" element={<DoctorRecordsPage />} />
      <Route path="/doctor/create-record" element={<CreateRecord />} />
      <Route path="/doctor/my-patients" element={<MyPatientsPage />} />
      <Route path="/doctor/get-patient-details" element={<GetPatientDetailsPage />} />
      <Route path="/doctor/write-prescription" element={<PrescriptionForm />} />
      <Route path="/doctor/prescriptions" element={<DoctorPrescriptions />} />
      <Route path="/doctor/patient-history/:patientId" element={<ViewPatientHistory />} />
      <Route path="/patient/dashboard" element={<PatientDashboard />} />
      {/* Patient subpages */}
      <Route path="/patient/medical-history" element={<MedicalHistoryPage />} />
      <Route path="/patient/prescriptions" element={<PrescriptionsPage />} />
      <Route path="/patient/manage-access" element={<GrantAccessPage />} />
      <Route path="/patient/insurance-requests" element={<InsuranceRequestsPage />} />
      <Route path="/patient/research-requests" element={<ResearchRequestsPage />} />

      {/* Insurance Routes */}
      <Route path="/insurance/dashboard" element={<InsuranceDashboard />} />
      <Route path="/insurance/check-patient-data" element={<InsuranceCheckPatientData />} />
      <Route path="/insurance/granted" element={<InsuranceGranted />} />
      <Route path="/insurance/rejected" element={<InsuranceRejected />} />
      <Route path="/insurance/analytics" element={<InsuranceAnalytics />} />

      {/* Research Organization Routes */}
      <Route path="/research/dashboard" element={<ResearchDashboard />} />
      <Route path="/research/groups/create" element={<ResearchCreateGroup />} />
      <Route path="/research/groups" element={<ResearchViewGroups />} />
      <Route path="/research/analytics" element={<ResearchAnalytics />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </ToastProvider>
  );
}
