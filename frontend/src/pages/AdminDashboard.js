import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Users, 
  Briefcase, 
  FileText, 
  Settings, 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  UserCog
} from 'lucide-react';
import { NotificationBell } from '../components/notifications';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AdminDashboard = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    clients: 0,
    jobs: 0,
    candidates: 0,
    interviews: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [clientsRes, jobsRes, interviewStatsRes] = await Promise.all([
        axios.get(`${API}/clients`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/jobs`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/interviews/stats/pipeline`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setStats({
        clients: clientsRes.data.length,
        jobs: jobsRes.data.length,
        candidates: jobsRes.data.reduce((sum, job) => sum + (job.candidates_count || 0), 0),
        interviews: interviewStatsRes.data
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      <nav className="bg-blue-900 text-white p-4 shadow-lg" data-testid="admin-nav">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold" data-testid="admin-nav-title">Arbeit Talent Portal</h1>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <span className="text-sm" data-testid="admin-user-info">
              {user?.name} ({user?.role})
            </span>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-white text-white hover:bg-blue-800"
              data-testid="logout-button"
            >
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-8">
        <Card className="shadow-xl mb-8" data-testid="admin-dashboard-card">
          <CardHeader className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
            <CardTitle className="text-3xl" data-testid="admin-dashboard-title">
              Admin Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="border-l-4 border-teal-500 pl-4" data-testid="admin-welcome">
                <h2 className="text-2xl font-semibold text-blue-900 mb-2">
                  Welcome, {user?.name}!
                </h2>
                <p className="text-gray-600 text-lg">
                  Full system access enabled. Manage clients, jobs, candidates, and interviews.
                </p>
              </div>

              {/* Quick Stats - Clickable */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div 
                  className="bg-blue-50 rounded-lg p-4 text-center cursor-pointer hover:bg-blue-100 hover:shadow-md transition-all"
                  onClick={() => navigate('/clients')}
                  data-testid="stats-clients"
                >
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold text-blue-900">{stats.clients}</p>
                  <p className="text-sm text-gray-600">Clients</p>
                </div>
                <div 
                  className="bg-teal-50 rounded-lg p-4 text-center cursor-pointer hover:bg-teal-100 hover:shadow-md transition-all"
                  onClick={() => navigate('/jobs')}
                  data-testid="stats-jobs"
                >
                  <Briefcase className="h-8 w-8 mx-auto mb-2 text-teal-600" />
                  <p className="text-2xl font-bold text-teal-900">{stats.jobs}</p>
                  <p className="text-sm text-gray-600">Active Jobs</p>
                </div>
                <div 
                  className="bg-purple-50 rounded-lg p-4 text-center cursor-pointer hover:bg-purple-100 hover:shadow-md transition-all"
                  onClick={() => navigate('/candidates')}
                  data-testid="stats-candidates"
                >
                  <FileText className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <p className="text-2xl font-bold text-purple-900">{stats.candidates}</p>
                  <p className="text-sm text-gray-600">Candidates</p>
                </div>
                <div 
                  className="bg-amber-50 rounded-lg p-4 text-center cursor-pointer hover:bg-amber-100 hover:shadow-md transition-all"
                  onClick={() => navigate('/interviews')}
                  data-testid="stats-interviews"
                >
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-amber-600" />
                  <p className="text-2xl font-bold text-amber-900">{stats.interviews?.total_interviews || 0}</p>
                  <p className="text-sm text-gray-600">Interviews</p>
                </div>
              </div>

              {/* Navigation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <Card 
                  className="border-2 border-blue-200 hover:shadow-lg transition-shadow cursor-pointer" 
                  data-testid="admin-feature-clients"
                  onClick={() => navigate('/clients')}
                >
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">Manage Clients</h3>
                    <p className="text-gray-600 text-sm">Create and manage client companies</p>
                    <Button className="mt-3 bg-blue-900 hover:bg-blue-800 w-full">
                      Open
                    </Button>
                  </CardContent>
                </Card>

                <Card 
                  className="border-2 border-blue-200 hover:shadow-lg transition-shadow cursor-pointer" 
                  data-testid="admin-feature-jobs"
                  onClick={() => navigate('/jobs')}
                >
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">Job Requirements</h3>
                    <p className="text-gray-600 text-sm">View and manage all job postings</p>
                    <Button className="mt-3 bg-blue-900 hover:bg-blue-800 w-full">
                      Open
                    </Button>
                  </CardContent>
                </Card>

                <Card 
                  className="border-2 border-blue-200 hover:shadow-lg transition-shadow cursor-pointer" 
                  data-testid="admin-feature-candidates"
                  onClick={() => navigate('/candidates')}
                >
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">Candidates</h3>
                    <p className="text-gray-600 text-sm">View and manage all candidates</p>
                    <Button className="mt-3 bg-blue-900 hover:bg-blue-800 w-full">
                      Open
                    </Button>
                  </CardContent>
                </Card>

                <Card 
                  className="border-2 border-amber-200 hover:shadow-lg transition-shadow cursor-pointer" 
                  data-testid="admin-feature-governance"
                  onClick={() => navigate('/governance')}
                >
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-amber-900 mb-2">
                      <Settings className="h-5 w-5 inline mr-2" />
                      Governance
                    </h3>
                    <p className="text-gray-600 text-sm">RBAC, Audit Logs & Access Control</p>
                    <Button className="mt-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white w-full">
                      Open
                    </Button>
                  </CardContent>
                </Card>

                <Card 
                  className="border-2 border-purple-200 hover:shadow-lg transition-shadow cursor-pointer" 
                  data-testid="admin-feature-portal-management"
                  onClick={() => navigate('/candidate-portal-management')}
                >
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-purple-900 mb-2">
                      <UserCog className="h-5 w-5 inline mr-2" />
                      Portal Users
                    </h3>
                    <p className="text-gray-600 text-sm">Manage Candidate Portal Access</p>
                    <Button className="mt-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white w-full">
                      Manage
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interview Pipeline Widget */}
        {stats.interviews && (
          <Card className="shadow-xl" data-testid="interview-pipeline-card">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <CardTitle className="text-xl flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Interview Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div 
                  className="text-center p-3 bg-amber-50 rounded-lg cursor-pointer hover:bg-amber-100 hover:shadow-md transition-all"
                  onClick={() => navigate('/interviews?status=Awaiting Candidate Confirmation')}
                  data-testid="pipeline-awaiting"
                >
                  <Clock className="h-6 w-6 mx-auto mb-1 text-amber-600" />
                  <p className="text-2xl font-bold text-amber-800">{stats.interviews.awaiting_confirmation}</p>
                  <p className="text-xs text-gray-600">Awaiting</p>
                </div>
                <div 
                  className="text-center p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 hover:shadow-md transition-all"
                  onClick={() => navigate('/interviews?status=Confirmed')}
                  data-testid="pipeline-confirmed"
                >
                  <CheckCircle className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                  <p className="text-2xl font-bold text-blue-800">{stats.interviews.confirmed}</p>
                  <p className="text-xs text-gray-600">Confirmed</p>
                </div>
                <div 
                  className="text-center p-3 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 hover:shadow-md transition-all"
                  onClick={() => navigate('/interviews?status=Scheduled')}
                  data-testid="pipeline-scheduled"
                >
                  <Calendar className="h-6 w-6 mx-auto mb-1 text-green-600" />
                  <p className="text-2xl font-bold text-green-800">{stats.interviews.scheduled}</p>
                  <p className="text-xs text-gray-600">Scheduled</p>
                </div>
                <div 
                  className="text-center p-3 bg-teal-50 rounded-lg cursor-pointer hover:bg-teal-100 hover:shadow-md transition-all"
                  onClick={() => navigate('/interviews?status=Completed')}
                  data-testid="pipeline-completed"
                >
                  <CheckCircle className="h-6 w-6 mx-auto mb-1 text-teal-600" />
                  <p className="text-2xl font-bold text-teal-800">{stats.interviews.completed}</p>
                  <p className="text-xs text-gray-600">Completed</p>
                </div>
                <div 
                  className="text-center p-3 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100 hover:shadow-md transition-all"
                  onClick={() => navigate('/interviews?status=No Show')}
                  data-testid="pipeline-noshows"
                >
                  <XCircle className="h-6 w-6 mx-auto mb-1 text-red-600" />
                  <p className="text-2xl font-bold text-red-800">{stats.interviews.no_shows}</p>
                  <p className="text-xs text-gray-600">No Shows</p>
                </div>
                <div 
                  className="text-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 hover:shadow-md transition-all"
                  onClick={() => navigate('/interviews?status=Cancelled')}
                  data-testid="pipeline-cancelled"
                >
                  <XCircle className="h-6 w-6 mx-auto mb-1 text-gray-600" />
                  <p className="text-2xl font-bold text-gray-800">{stats.interviews.cancelled}</p>
                  <p className="text-xs text-gray-600">Cancelled</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
