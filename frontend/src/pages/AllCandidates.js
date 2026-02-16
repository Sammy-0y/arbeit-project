import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Search, Users, Briefcase, Filter } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AllCandidates = () => {
  const navigate = useNavigate();
  const { token, logout, user } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [jobFilter, setJobFilter] = useState('ALL');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      // Fetch all jobs first
      const jobsRes = await axios.get(`${API}/jobs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobs(jobsRes.data);

      // Fetch candidates for each job
      const allCandidates = [];
      for (const job of jobsRes.data) {
        try {
          const candidatesRes = await axios.get(`${API}/jobs/${job.job_id}/candidates`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          // Add job info to each candidate
          candidatesRes.data.forEach(candidate => {
            allCandidates.push({
              ...candidate,
              job_title: job.title,
              job_id: job.job_id
            });
          });
        } catch (err) {
          console.error(`Failed to fetch candidates for job ${job.job_id}:`, err);
        }
      }
      setCandidates(allCandidates);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      if (error.response?.status === 401) {
        logout();
        navigate('/login');
      } else {
        toast.error('Failed to load candidates');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'INTERVIEW_SCHEDULED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.current_role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.job_title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || candidate.status === statusFilter;
    const matchesJob = jobFilter === 'ALL' || candidate.job_id === jobFilter;
    return matchesSearch && matchesStatus && matchesJob;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center max-w-7xl">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="ghost"
              className="text-white hover:bg-white/10"
              data-testid="back-button"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="h-6 w-px bg-white/30" />
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Candidates
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-white/20 text-white">
              {filteredCandidates.length} candidates
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6 max-w-7xl">
        {/* Filters */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, role, or job..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="search-candidates"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]" data-testid="status-filter">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="NEW">New</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="INTERVIEW_SCHEDULED">Interview Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-gray-500" />
                <Select value={jobFilter} onValueChange={setJobFilter}>
                  <SelectTrigger className="w-[200px]" data-testid="job-filter">
                    <SelectValue placeholder="Job" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Jobs</SelectItem>
                    {jobs.map(job => (
                      <SelectItem key={job.job_id} value={job.job_id}>
                        {job.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Candidates Grid */}
        {filteredCandidates.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No candidates found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'ALL' || jobFilter !== 'ALL'
                  ? 'Try adjusting your filters'
                  : 'Candidates will appear here once they are added to jobs'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCandidates.map((candidate, index) => (
              <Card
                key={`${candidate.candidate_id}-${index}`}
                onClick={() => navigate(`/candidates/${candidate.candidate_id}`)}
                className="group cursor-pointer border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-white overflow-hidden"
                data-testid={`candidate-card-${candidate.candidate_id}`}
              >
                <div className="h-2 bg-gradient-to-r from-blue-600 to-teal-600"></div>
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                        {candidate.name || 'Unknown Candidate'}
                      </h3>
                      {candidate.current_role && (
                        <p className="text-sm text-gray-600">{candidate.current_role}</p>
                      )}
                    </div>
                    {/* AI Match Score */}
                    <div className="flex flex-col items-center">
                      <div className="relative w-12 h-12">
                        <svg className="transform -rotate-90 w-12 h-12">
                          <circle cx="24" cy="24" r="20" stroke="#e5e7eb" strokeWidth="4" fill="none" />
                          <circle
                            cx="24" cy="24" r="20"
                            stroke="#3b82f6"
                            strokeWidth="4"
                            fill="none"
                            strokeDasharray={`${(candidate.ai_story?.fit_score || 50) * 1.256} 125.6`}
                            className="transition-all duration-500"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-blue-600">
                          {candidate.ai_story?.fit_score || 50}%
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 mt-1">AI Match</span>
                    </div>
                  </div>

                  {/* Job Position */}
                  <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Applied for:</p>
                    <p className="text-sm font-semibold text-blue-800 flex items-center">
                      <Briefcase className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                      {candidate.job_title || 'Unknown Position'}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(candidate.status)}>
                      {candidate.status}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {new Date(candidate.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Skills Preview */}
                  {candidate.skills && candidate.skills.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1">
                      {candidate.skills.slice(0, 3).map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs bg-gray-50">
                          {skill}
                        </Badge>
                      ))}
                      {candidate.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs bg-gray-50">
                          +{candidate.skills.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AllCandidates;
