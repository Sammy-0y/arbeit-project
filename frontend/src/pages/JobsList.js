import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Search, Plus, Briefcase, MapPin, Clock, ArrowLeft, Trash2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const JobsList = () => {
  const navigate = useNavigate();
  const { token, logout, user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async (searchQuery = '', statusFilterValue = '') => {
    try {
      let params = [];
      if (searchQuery) params.push(`search=${searchQuery}`);
      if (statusFilterValue) params.push(`status=${statusFilterValue}`);
      const queryString = params.length > 0 ? `?${params.join('&')}` : '';
      
      const response = await axios.get(`${API}/jobs${queryString}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobs(response.data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      if (error.response?.status === 401) {
        logout();
        navigate('/login');
      } else {
        toast.error('Failed to load jobs');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchJobs(search, statusFilter);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    fetchJobs(search, status);
  };

  const handleDeleteJob = async (jobId, jobTitle) => {
    if (!window.confirm(`Are you sure you want to delete the job "${jobTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(`${API}/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Job deleted successfully');
      fetchJobs(search, statusFilter);
    } catch (error) {
      console.error('Failed to delete job:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete job');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-teal-500';
      case 'Draft': return 'bg-yellow-500';
      case 'Closed': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      <nav className="bg-blue-900 text-white p-4 shadow-lg" data-testid="jobs-nav">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold cursor-pointer" onClick={() => navigate('/dashboard')}>
              Arbeit Talent Portal
            </h1>
            <Badge variant="outline" className="border-white text-white">
              Job Requirements
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="ghost"
              className="text-white hover:bg-blue-800"
              data-testid="back-to-dashboard-button"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <span className="text-sm">{user?.name}</span>
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
        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Briefcase className="h-8 w-8" />
                <CardTitle className="text-3xl" data-testid="page-title">
                  Job Requirements
                </CardTitle>
              </div>
              <Button
                onClick={() => navigate('/jobs/create')}
                className="bg-teal-500 hover:bg-teal-600 text-white"
                data-testid="create-job-button"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Job
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Search and Filter */}
            <div className="flex gap-4 mb-6">
              <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by title or skills..."
                    className="pl-10"
                    data-testid="search-input"
                  />
                </div>
                <Button type="submit" data-testid="search-button">Search</Button>
                {(search || statusFilter) && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSearch('');
                      setStatusFilter('');
                      fetchJobs();
                    }}
                  >
                    Clear
                  </Button>
                )}
              </form>
              
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'Active' ? 'default' : 'outline'}
                  onClick={() => handleStatusFilter(statusFilter === 'Active' ? '' : 'Active')}
                  size="sm"
                >
                  Active
                </Button>
                <Button
                  variant={statusFilter === 'Draft' ? 'default' : 'outline'}
                  onClick={() => handleStatusFilter(statusFilter === 'Draft' ? '' : 'Draft')}
                  size="sm"
                >
                  Draft
                </Button>
                <Button
                  variant={statusFilter === 'Closed' ? 'default' : 'outline'}
                  onClick={() => handleStatusFilter(statusFilter === 'Closed' ? '' : 'Closed')}
                  size="sm"
                >
                  Closed
                </Button>
              </div>
            </div>

            {/* Jobs List */}
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading jobs...</div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12 text-gray-500" data-testid="empty-state">
                <Briefcase className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">No job requirements found</p>
                <p className="text-sm">Create your first job requirement to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <Card
                    key={job.job_id}
                    className="border border-blue-200 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/jobs/${job.job_id}`)}
                    data-testid={`job-card-${job.job_id}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold text-blue-900">{job.title}</h3>
                            <Badge className={getStatusColor(job.status)}>
                              {job.status}
                            </Badge>
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                            {job.company_name && (
                              <div className="flex items-center gap-1">
                                <Briefcase className="h-4 w-4" />
                                <span>{job.company_name}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{job.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{job.employment_type}</span>
                            </div>
                            <div>
                              <span className="font-medium">{job.work_model}</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {job.required_skills.slice(0, 5).map((skill, idx) => (
                              <Badge key={idx} variant="outline" className="bg-blue-50">
                                {skill}
                              </Badge>
                            ))}
                            {job.required_skills.length > 5 && (
                              <Badge variant="outline">+{job.required_skills.length - 5} more</Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <p className="text-sm text-gray-500">{new Date(job.created_at).toLocaleDateString()}</p>
                          {user?.role === 'admin' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteJob(job.job_id, job.title);
                              }}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};