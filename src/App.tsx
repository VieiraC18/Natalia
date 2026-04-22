import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './components/DashboardLayout';
import CalendarView from './components/CalendarView';
import AdminPanel from './pages/AdminPanel';
import Workplaces from './pages/Workplaces';
import Reports from './pages/Reports';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<CalendarView />} />
            <Route path="workplaces" element={<Workplaces />} />
            <Route path="reports" element={<Reports />} />
            <Route path="admin" element={<AdminPanel />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
