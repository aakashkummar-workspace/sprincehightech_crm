import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';

import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Tenders from './pages/Tenders.jsx';
import TenderDetail from './pages/TenderDetail.jsx';
import Projects from './pages/Projects.jsx';
import ProjectDetail from './pages/ProjectDetail.jsx';
import Subcontractors from './pages/Subcontractors.jsx';
import SubcontractorDetail from './pages/SubcontractorDetail.jsx';
import Employees from './pages/Employees.jsx';
import Finance from './pages/Finance.jsx';
import DailyWorkUpdates from './pages/DailyWorkUpdates.jsx';
import Reports from './pages/Reports.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tenders" element={<Tenders />} />
            <Route path="/tenders/:id" element={<TenderDetail />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/subcontractors" element={<Subcontractors />} />
            <Route path="/subcontractors/:id" element={<SubcontractorDetail />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/daily-updates" element={<DailyWorkUpdates />} />
            <Route path="/reports" element={<Reports />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
