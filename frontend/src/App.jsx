import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import Login from './pages/Login';
import SetPassword from './pages/SetPassword';
import UserProfile from './pages/UserProfile';

const MainContent = () => {
  const { user, loading } = useAuth();
  const [needsPasswordSet, setNeedsPasswordSet] = useState(false);
  const [tempPassword, setTempPassword] = useState('');

  if (loading) {
    return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-secondary)'}}>Loading...</div>;
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

  const Dashboard = user.role === 'manager' ? ManagerDashboard : EmployeeDashboard;

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/profile" element={<UserProfile />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="app-container">
            <AppHeader />
            <MainContent />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Extract Navbar so it can consume useAuth without errors
const AppHeader = () => {
  const { user } = useAuth();
  if (!user || user.is_first_login) return null;
  return <Navbar />;
};

export default App;
