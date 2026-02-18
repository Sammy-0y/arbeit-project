import React from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CandidateAuthProvider, useCandidateAuth } from './contexts/CandidateAuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import PublicJobDetail from "./PublicJobDetail";
import { RecruiterDashboard } from './pages/RecruiterDashboard';
import { ClientDashboard } from './pages/ClientDashboard';
import { ClientsList } from './pages/ClientsList';
import { ClientDetail } from './pages/ClientDetail';
import { JobsList } from './pages/JobsList';
import { JobDetail } from './pages/JobDetail';
import { JobForm } from './pages/JobForm';
import PublicJobs from "./PublicJobs";
import { CandidatesList } from './pages/CandidatesList';
import { CandidateDetail } from './pages/CandidateDetail';
import { CandidateStoryView } from './pages/CandidateStoryView';
import { AllCandidates } from './pages/AllCandidates';
import { CandidatePortalManagement } from './pages/CandidatePortalManagement';
import { InterviewsListPage } from './pages/interviews/InterviewsListPage';
import { Unauthorized } from './pages/Unauthorized';
import { Toaster } from './components/ui/sonner';
import { useAuth } from './contexts/AuthContext';
import { GovernanceLayout } from './pages/governance/GovernanceLayout';
import { RolesPermissions } from './pages/governance/RolesPermissions';
import { RoleAssignments } from './pages/governance/RoleAssignments';
import { AccessMatrix } from './pages/governance/AccessMatrix';
import { AuditLogs } from './pages/governance/AuditLogs';
import { CandidateLogin } from './pages/candidate-portal/CandidateLogin';
import { CandidateDashboard } from './pages/candidate-portal/CandidateDashboard';

const DashboardRouter = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'recruiter':
      return <RecruiterDashboard />;
    case 'client_user':
      return <ClientDashboard />;
    default:
      return <Navigate to="/unauthorized" replace />;
  }
};

// Protected route for candidate portal
const CandidateProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useCandidateAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/candidate/login" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CandidateAuthProvider>
          <Toaster position="top-right" />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Candidate Portal Routes */}
            <Route path="/candidate/login" element={<CandidateLogin />} />
            <Route 
              path="/candidate/dashboard" 
              element={
                <CandidateProtectedRoute>
                  <CandidateDashboard />
                </CandidateProtectedRoute>
              } 
            />
            {/* Redirect old booking page to candidate login */}
            <Route path="/book/:interviewId/:bookingToken" element={<Navigate to="/candidate/login" replace />} />
            
            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients"
              element={
                <ProtectedRoute allowedRoles={['admin', 'recruiter']}>
                  <ClientsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients/:clientId"
              element={
                <ProtectedRoute allowedRoles={['admin', 'recruiter']}>
                  <ClientDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs"
              element={
                <ProtectedRoute>
                  <JobsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs/create"
              element={
                <ProtectedRoute>
                  <JobForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs/:jobId"
              element={
                <ProtectedRoute>
                  <JobDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs/:jobId/edit"
              element={
                <ProtectedRoute>
                  <JobForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidates"
              element={
                <ProtectedRoute>
                  <AllCandidates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/interviews"
              element={
                <ProtectedRoute>
                  <InterviewsListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidate-portal-management"
              element={
                <ProtectedRoute allowedRoles={['admin', 'recruiter']}>
                  <CandidatePortalManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs/:jobId/candidates"
              element={
                <ProtectedRoute>
                  <CandidatesList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidates/:candidateId"
              element={
                <ProtectedRoute>
                  <CandidateDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidates/:candidateId/story"
              element={
                <ProtectedRoute>
                  <CandidateStoryView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/governance"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <GovernanceLayout />
                </ProtectedRoute>
              }
            >
              <Route path="roles" element={<RolesPermissions />} />
              <Route path="assignments" element={<RoleAssignments />} />
              <Route path="matrix" element={<AccessMatrix />} />
              <Route path="audit" element={<AuditLogs />} />
              <Route index element={<Navigate to="roles" replace />} />
            </Route>
            <Route path="/careers" element={<PublicJobs />} />
            <Route path="/careers/:jobId" element={<PublicJobDetail />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </CandidateAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
