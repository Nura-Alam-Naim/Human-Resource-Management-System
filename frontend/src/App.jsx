import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import SetPassword from './pages/SetPassword';
import UserProfile from './pages/UserProfile';
import AllEmployees from './pages/AllEmployees';
import OrgChart from './pages/OrgChart';
import AdminSettings from './pages/AdminSettings';
import ResolveMemberRequest from './pages/ResolveMemberRequest';
import TransferEmployee from './pages/TransferEmployee';
import Timesheets from './pages/Timesheets';
import CompanyTimesheets from './pages/CompanyTimesheets';
import PublicHolidays from './pages/PublicHolidays';
import DepartmentView from './pages/DepartmentView';
import Messages from './pages/Messages';
import PayrollManagement from './pages/PayrollManagement';
import MyPayslips from './pages/MyPayslips';
import Careers from './pages/Careers';
import RecruitmentATS from './pages/RecruitmentATS';
import MyPerformance from './pages/MyPerformance';
import TeamPerformance from './pages/TeamPerformance';
import AssetsManagement from './pages/AssetsManagement';
import MyExpenses from './pages/MyExpenses';
import ManageExpenses from './pages/ManageExpenses';
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster } from 'react-hot-toast';

const MainContent = () => {
  const { user, loading } = useAuth();
  const [needsPasswordSet, setNeedsPasswordSet] = useState(false);
  const [tempPassword, setTempPassword] = useState('');

  if (loading) {
    return <div className="flex justify-center align-center h-screen text-secondary"><div className="spinner"></div></div>;
  }

  // Handle first time login flow
  const handleFirstLogin = (usedPassword) => {
    setTempPassword(usedPassword);
    setNeedsPasswordSet(true);
  };

  if (!user) {
    return <Login onFirstLogin={handleFirstLogin} />;
  }

  if (user.is_first_login || needsPasswordSet) {
    return <SetPassword 
      oldPassword={tempPassword} 
      onPasswordSet={() => setNeedsPasswordSet(false)} 
    />;
  }

  const Dashboard = user.role === 'admin' ? AdminDashboard : (user.role === 'manager' ? ManagerDashboard : EmployeeDashboard);

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/profile" element={<UserProfile />} />
      {(user.role === 'manager' || user.role === 'admin') && (
        <>
          <Route path="/all-employees" element={<AllEmployees />} />
          <Route path="/team-performance" element={<TeamPerformance />} />
          <Route path="/manage-expenses" element={<ManageExpenses />} />
        </>
      )}
      {user.role === 'admin' && (
        <>
          <Route path="/settings" element={<AdminSettings />} />
          <Route path="/company-timesheets" element={<CompanyTimesheets />} />
          <Route path="/holidays" element={<PublicHolidays />} />
          <Route path="/department/:id" element={<DepartmentView />} />
          <Route path="/resolve-request/:id" element={<ResolveMemberRequest />} />
          <Route path="/transfer-employees" element={<TransferEmployee />} />
          <Route path="/payroll" element={<PayrollManagement />} />
          <Route path="/recruitment" element={<RecruitmentATS />} />
          <Route path="/assets" element={<AssetsManagement />} />
        </>
      )}
      <Route path="/my-timesheets" element={user ? <Timesheets /> : <Navigate to="/login" />} />
      <Route path="/org-chart" element={user ? <OrgChart /> : <Navigate to="/login" />} />
      <Route path="/messages" element={user ? <Messages /> : <Navigate to="/login" />} />
      <Route path="/my-payslips" element={user ? <MyPayslips /> : <Navigate to="/login" />} />
      <Route path="/my-performance" element={user ? <MyPerformance /> : <Navigate to="/login" />} />
      <Route path="/my-expenses" element={user ? <MyExpenses /> : <Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/careers" element={<Careers />} />
              <Route path="/register" element={<Register />} />
              <Route path="/*" element={
                <div className="app-container">
                  <AppHeader />
                  <MainContent />
                  <Toaster position="top-right" />
                </div>
              } />
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

// Extract Navbar so it can consume useAuth without errors
const AppHeader = () => {
  const { user } = useAuth();
  if (!user || user.is_first_login) return null;
  return <Navbar />;
};

export default App;
