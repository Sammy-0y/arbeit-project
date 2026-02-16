import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Edit, XCircle, Briefcase, MapPin, Clock, DollarSign, GraduationCap, Users, UserCheck } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const JobDetail = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const { token, logout, user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const response = await axios.get(`${API}/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJob(response.data);
    } catch (error) {
      console.error('Failed to fetch job:', error);
      if (error.response?.status === 401) {
        logout();
        navigate('/login');
      } else if (error.response?.status === 403) {
        toast.error('Access denied');
        navigate('/jobs');
      } else {
        toast.error('Failed to load job details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCloseJob = async () => {
    if (!window.confirm('Are you sure you want to close this job?')) return;
    
    try {
      await axios.patch(`${API}/jobs/${jobId}/close`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Job closed successfully');
      fetchJobDetails();
    } catch (error) {
      toast.error('Failed to close job');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-teal-500';
      case 'Draft': return 'bg-yellow-500';
      case 'Closed': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!job) {
    return <div className="min-h-screen flex items-center justify-center">Job not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      <nav className="bg-blue-900 text-white p-4 shadow-lg" data-testid="job-detail-nav">
        <div className="container mx-auto flex justify-between items-center">
          <Button
            onClick={() => navigate('/jobs')}
            variant="ghost"
            className="text-white hover:bg-blue-800"
            data-testid="back-button"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Button>
        </div>
      </nav>

      <div className="container mx-auto p-8 max-w-5xl">
        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Briefcase className="h-8 w-8" />
                  <CardTitle className="text-3xl" data-testid="job-title">{job.title}</CardTitle>
                </div>
                {job.company_name && (
                  <p className="text-blue-100 text-lg">{job.company_name}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Badge className={`${getStatusColor(job.status)} text-white`} data-testid="job-status">
                  {job.status}
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            {/* Actions */}
            <div className="flex gap-2 mb-6">
              <Button
                onClick={() => navigate(`/jobs/${jobId}/candidates`)}
                className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700"
                data-testid="view-candidates-button"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                View Candidates
              </Button>
              <Button
                onClick={() => navigate(`/jobs/${jobId}/edit`)}
                className="bg-blue-900 hover:bg-blue-800"
                data-testid="edit-job-button"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Job
              </Button>
              {job.status !== 'Closed' && (
                <Button
                  onClick={handleCloseJob}
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-50"
                  data-testid="close-job-button"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Close Job
                </Button>
              )}
            </div>

            {/* Job Details */}
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm font-medium">Location</span>
                  </div>
                  <p className="text-lg text-blue-900 font-semibold">{job.location}</p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">Employment Type</span>
                  </div>
                  <p className="text-lg text-blue-900 font-semibold">{job.employment_type}</p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-medium">Work Model</span>
                  </div>
                  <p className="text-lg text-blue-900 font-semibold">{job.work_model}</p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <GraduationCap className="h-4 w-4" />
                    <span className="text-sm font-medium">Experience</span>
                  </div>
                  <p className="text-lg text-blue-900 font-semibold">
                    {job.experience_range.min_years} - {job.experience_range.max_years} years
                  </p>
                </div>
              </div>

              {/* Salary Range */}
              {job.salary_range && (
                <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm font-medium">Salary Range</span>
                  </div>
                  <p className="text-lg text-teal-900 font-semibold">
                    {job.salary_range.currency} {job.salary_range.min_amount?.toLocaleString() || 'N/A'} - {job.salary_range.max_amount?.toLocaleString() || 'N/A'}
                  </p>
                </div>
              )}

              {/* Required Skills */}
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.required_skills.map((skill, idx) => (
                    <Badge key={idx} className="bg-blue-100 text-blue-900 hover:bg-blue-200">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Job Description</h3>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
                </div>
              </div>

              {/* Metadata */}
              <div className="border-t pt-4 text-sm text-gray-600">
                <p><span className="font-medium">Created:</span> {new Date(job.created_at).toLocaleString()}</p>
                <p><span className="font-medium">Created by:</span> {job.created_by}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};