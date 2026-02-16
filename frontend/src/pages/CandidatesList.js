import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Users, Sparkles, Trash2 } from 'lucide-react';
import { AddCandidateModal } from '../components/candidates/AddCandidateModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const CandidatesList = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const { token, logout, user } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [showRejected, setShowRejected] = useState(false);

  useEffect(() => {
    fetchJobAndCandidates();
  }, [jobId, showRejected]);

  const fetchJobAndCandidates = async () => {
    try {
      // Fetch job details
      const jobResponse = await axios.get(`${API}/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJob(jobResponse.data);

      // Fetch candidates with show_rejected parameter
      const candidatesResponse = await axios.get(
        `${API}/jobs/${jobId}/candidates?show_rejected=${showRejected}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCandidates(candidatesResponse.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      if (error.response?.status === 401) {
        logout();
        navigate('/login');
      } else if (error.response?.status === 403) {
        toast.error('Access denied');
        navigate('/jobs');
      } else {
        toast.error('Failed to load candidates');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateAdded = () => {
    setShowAddModal(false);
    fetchJobAndCandidates();
    toast.success('Candidate added successfully');
  };

  const handleDeleteCandidate = async (candidateId, candidateName) => {
    if (!window.confirm(`Are you sure you want to delete candidate "${candidateName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(`${API}/candidates/${candidateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Candidate deleted successfully');
      fetchJobAndCandidates();
    } catch (error) {
      console.error('Failed to delete candidate:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete candidate');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'NEW': return 'bg-blue-500 hover:bg-blue-600';
      case 'PIPELINE': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'APPROVED': return 'bg-teal-500 hover:bg-teal-600';
      case 'REJECTED': return 'bg-red-500 hover:bg-red-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const filteredCandidates = statusFilter === 'All'
    ? candidates
    : candidates.filter(c => c.status === statusFilter);

  const canAddCandidate = user?.role === 'admin' || user?.role === 'recruiter';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      {/* Navigation */}
      <nav className="bg-gradient-to-r from-blue-900 via-blue-800 to-teal-800 text-white p-4 shadow-2xl backdrop-blur-sm">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate(`/jobs/${jobId}`)}
              variant="ghost"
              className="text-white hover:bg-white/10 transition-all"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Job
            </Button>
            <div className="border-l border-white/20 h-8 mx-2"></div>
            <div>
              <div className="text-xs text-blue-200">Candidates for</div>
              <div className="font-semibold text-lg">{job?.title}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-blue-100">{user?.name}</span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              Candidates
            </h1>
            <p className="text-gray-600">{filteredCandidates.length} candidates found</p>
          </div>
          {canAddCandidate && (
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Candidate
            </Button>
          )}
        </div>

        {/* Status Filter Chips */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div className="flex gap-2 flex-wrap">
            {['All', 'NEW', 'PIPELINE', 'APPROVED', 'REJECTED'].map((status) => (
              <button
                key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all transform hover:scale-105 ${
                statusFilter === status
                  ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              }`}
            >
              {status === 'All' ? 'All' : status}
              <span className="ml-2 opacity-75">
                ({status === 'All' ? candidates.length : candidates.filter(c => c.status === status).length})
              </span>
              </button>
            ))}
          </div>

          {/* Show Rejected Toggle */}
          <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-full border border-gray-300 hover:border-blue-400 transition-all">
            <input
              type="checkbox"
              checked={showRejected}
              onChange={(e) => setShowRejected(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Show Rejected</span>
          </label>
        </div>

        {/* Candidates Grid */}
        {filteredCandidates.length === 0 ? (
          <Card className="shadow-xl border-0">
            <CardContent className="p-12 text-center">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No candidates found</h3>
              <p className="text-gray-500 mb-6">
                {statusFilter === 'All'
                  ? 'Add your first candidate to get started'
                  : `No candidates with status "${statusFilter}"`}
              </p>
              {canAddCandidate && statusFilter === 'All' && (
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Candidate
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCandidates.map((candidate, index) => (
              <Card
                key={candidate.candidate_id}
                onClick={() => navigate(`/candidates/${candidate.candidate_id}`)}
                className="group cursor-pointer border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-white overflow-hidden"
                style={{
                  animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`
                }}
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
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            stroke="#e5e7eb"
                            strokeWidth="4"
                            fill="none"
                          />
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            stroke="url(#gradient)"
                            strokeWidth="4"
                            fill="none"
                            strokeDasharray={`${(candidate.ai_story?.fit_score || 50) * 1.256} 125.6`}
                            className="transition-all duration-500"
                          />
                          <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" style={{ stopColor: '#3b82f6' }} />
                              <stop offset="100%" style={{ stopColor: '#14b8a6' }} />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-700">
                            {candidate.ai_story?.fit_score || 50}%
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        AI Match
                      </div>
                    </div>
                  </div>

                  {/* Skills Tags */}
                  {candidate.skills && candidate.skills.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {candidate.skills.slice(0, 4).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md font-medium border border-blue-200"
                          >
                            {skill}
                          </span>
                        ))}
                        {candidate.skills.length > 4 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium">
                            +{candidate.skills.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Status Badge and Actions */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <Badge className={`${getStatusColor(candidate.status)} text-white shadow-sm`}>
                      {candidate.status}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {new Date(candidate.created_at).toLocaleDateString()}
                      </span>
                      {user?.role === 'admin' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCandidate(candidate.candidate_id, candidate.name);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Candidate Modal */}
      {canAddCandidate && (
        <AddCandidateModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleCandidateAdded}
          jobId={jobId}
          job={job}
        />
      )}

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};