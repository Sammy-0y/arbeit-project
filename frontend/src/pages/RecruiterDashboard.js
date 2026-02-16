import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useNavigate } from 'react-router-dom';
import { NotificationBell } from '../components/notifications';

export const RecruiterDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      <nav className="bg-blue-900 text-white p-4 shadow-lg" data-testid="recruiter-nav">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold" data-testid="recruiter-nav-title">Arbeit Talent Portal</h1>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <span className="text-sm" data-testid="recruiter-user-info">
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
        <Card className="shadow-xl" data-testid="recruiter-dashboard-card">
          <CardHeader className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
            <CardTitle className="text-3xl" data-testid="recruiter-dashboard-title">
              Recruiter Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="border-l-4 border-teal-500 pl-4" data-testid="recruiter-welcome">
                <h2 className="text-2xl font-semibold text-blue-900 mb-2">
                  Welcome, {user?.name}!
                </h2>
                <p className="text-gray-600 text-lg">
                  This is your recruiter dashboard placeholder. Manage candidates across all clients.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <Card 
                  className="border-2 border-blue-200 hover:shadow-lg transition-shadow cursor-pointer" 
                  data-testid="recruiter-feature-clients"
                  onClick={() => navigate('/clients')}
                >
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">Manage Clients</h3>
                    <p className="text-gray-600 text-sm">View and manage all clients</p>
                    <Button className="mt-3 bg-blue-900 hover:bg-blue-800 w-full">
                      Open
                    </Button>
                  </CardContent>
                </Card>

                <Card 
                  className="border-2 border-blue-200 hover:shadow-lg transition-shadow cursor-pointer" 
                  data-testid="recruiter-feature-jobs"
                  onClick={() => navigate('/jobs')}
                >
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">Job Requirements</h3>
                    <p className="text-gray-600 text-sm">View and manage all jobs</p>
                    <Button className="mt-3 bg-blue-900 hover:bg-blue-800 w-full">
                      Open
                    </Button>
                  </CardContent>
                </Card>

                <Card 
                  className="border-2 border-blue-200 hover:shadow-lg transition-shadow cursor-pointer" 
                  data-testid="recruiter-feature-candidates"
                  onClick={() => navigate('/candidates')}
                >
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">Manage Candidates</h3>
                    <p className="text-gray-600 text-sm">Upload and manage candidates</p>
                    <Button className="mt-3 bg-blue-900 hover:bg-blue-800 w-full">
                      Open
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
