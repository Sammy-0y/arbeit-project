import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Sparkles, ChevronDown, ChevronUp, FileText, RefreshCw, Eye, Download, MessageCircle, Calendar, Plus, ExternalLink, Mail, Send, Trash2 } from 'lucide-react';
import { CandidateStorySection } from '../components/candidates/CandidateStorySection';
import { CandidateResumeSection } from '../components/candidates/CandidateResumeSection';
import { ReviewPanel } from '../components/candidates/ReviewPanel';
import { InterviewScheduler, InterviewsList } from '../components/interviews';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const CandidateDetail = () => {
  const navigate = useNavigate();
  const { candidateId } = useParams();
  const { token, logout, user } = useAuth();
  const [candidate, setCandidate] = useState(null);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [regeneratingStory, setRegeneratingStory] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [interviewsKey, setInterviewsKey] = useState(0);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [deletingCandidate, setDeletingCandidate] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    story: true,
    resume: true,
    cv: true,
    interviews: true,
    reviews: true
  });

  useEffect(() => {
    fetchCandidateDetails();
  }, [candidateId]);

  const fetchCandidateDetails = async () => {
    try {
      const response = await axios.get(`${API}/candidates/${candidateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCandidate(response.data);
      
      // Also fetch job details
      if (response.data.job_id) {
        const jobResponse = await axios.get(`${API}/jobs/${response.data.job_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setJob(jobResponse.data);
      }
    } catch (error) {
      console.error('Failed to fetch candidate:', error);
      if (error.response?.status === 401) {
        logout();
        navigate('/login');
      } else if (error.response?.status === 403) {
        toast.error('Access denied');
        navigate('/jobs');
      } else {
        toast.error('Failed to load candidate details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInterviewScheduled = (interview) => {
    setShowScheduler(false);
    setInterviewsKey(prev => prev + 1);
    toast.success('Interview scheduled successfully!');
  };

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      await axios.put(
        `${API}/candidates/${candidateId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCandidate(prev => ({ ...prev, status: newStatus }));
      toast.success(`Status updated to ${newStatus}`, {
        description: `Candidate marked as ${newStatus}`,
        duration: 2000
      });
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleRegenerateStory = async () => {
    setRegeneratingStory(true);
    try {
      const response = await axios.post(
        `${API}/candidates/${candidateId}/regenerate-story`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCandidate(prev => ({
        ...prev,
        ai_story: response.data.ai_story
      }));
      toast.success('AI Story regenerated successfully');
    } catch (error) {
      console.error('Failed to regenerate story:', error);
      toast.error(error.response?.data?.detail || 'Failed to regenerate AI story');
    } finally {
      setRegeneratingStory(false);
    }
  };

  const handleSendSelectionNotification = async () => {
    if (!candidate?.email) {
      toast.error('Candidate does not have an email address. Please update the candidate profile first.');
      return;
    }
    
    if (!window.confirm(`Send selection notification to ${candidate.name} (${candidate.email})?\n\nThis will:\n- Create a candidate portal account\n- Send login credentials via email\n- Update status to SHORTLISTED`)) {
      return;
    }
    
    setSendingNotification(true);
    try {
      const response = await axios.post(
        `${API}/candidates/${candidateId}/send-selection-notification`,
        { candidate_id: candidateId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.email_sent) {
        toast.success(`Selection notification sent to ${candidate.email}!`);
      } else {
        toast.warning('Notification created but email delivery may have failed. Check the candidate\'s email.');
      }
      
      // Refresh candidate data
      fetchCandidateDetails();
    } catch (error) {
      console.error('Failed to send notification:', error);
      toast.error(error.response?.data?.detail || 'Failed to send selection notification');
    } finally {
      setSendingNotification(false);
    }
  };

  const handleDeleteCandidate = async () => {
    if (!window.confirm(`Are you sure you want to delete ${candidate.name}?\n\nThis action cannot be undone and will remove:\n- All candidate data\n- CV and documents\n- Interview records\n- Review history`)) {
      return;
    }
    
    setDeletingCandidate(true);
    try {
      await axios.delete(`${API}/candidates/${candidateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Candidate deleted successfully');
      navigate(`/jobs/${candidate.job_id}/candidates`);
    } catch (error) {
      console.error('Failed to delete candidate:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete candidate');
    } finally {
      setDeletingCandidate(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'NEW': return 'bg-blue-500';
      case 'PIPELINE': return 'bg-amber-500';
      case 'SHORTLISTED': return 'bg-purple-500';
      case 'APPROVED': return 'bg-green-500';
      case 'REJECTED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Get file extension to determine viewer type
  const getFileExtension = (url) => {
    if (!url) return null;
    const parts = url.split('.');
    return parts[parts.length - 1].toLowerCase();
  };

  const openResumeInNewTab = () => {
    if (candidate?.cv_file_url) {
      const fullUrl = candidate.cv_file_url.startsWith('http') 
        ? candidate.cv_file_url 
        : `${BACKEND_URL}${candidate.cv_file_url}`;
      window.open(fullUrl, '_blank');
    }
  };

  const downloadResume = () => {
    if (candidate?.cv_file_url) {
      const fullUrl = candidate.cv_file_url.startsWith('http') 
        ? candidate.cv_file_url 
        : `${BACKEND_URL}${candidate.cv_file_url}`;
      
      const link = document.createElement('a');
      link.href = fullUrl;
      link.download = `${candidate.name}_Resume.${getFileExtension(candidate.cv_file_url)}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center">
        <p className="text-gray-600">Candidate not found</p>
      </div>
    );
  }

  const canEdit = ['admin', 'recruiter'].includes(user?.role);
  const fileExtension = getFileExtension(candidate.cv_file_url);
  const isPdf = fileExtension === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50" data-testid="candidate-detail-page">
      <nav className="bg-blue-900 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            className="text-white hover:bg-blue-800"
            data-testid="back-button"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-4">
            <span className="text-sm">{user?.name}</span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-8 max-w-5xl">
        {/* Header Card */}
        <Card className="mb-6 shadow-xl border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-3xl mb-2" data-testid="candidate-name">
                  {candidate.name}
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`${getStatusColor(candidate.status)} text-white`} data-testid="candidate-status">
                    {candidate.status}
                  </Badge>
                  {candidate.email && (
                    <span className="text-blue-200 text-sm">{candidate.email}</span>
                  )}
                  {candidate.phone && (
                    <span className="text-blue-200 text-sm">• {candidate.phone}</span>
                  )}
                </div>
              </div>
              
              {canEdit && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-blue-200">Status:</span>
                    <Select
                      value={candidate.status}
                      onValueChange={handleStatusChange}
                      disabled={updatingStatus}
                    >
                      <SelectTrigger className="w-36 bg-white/10 border-white/30 text-white" data-testid="status-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NEW">NEW</SelectItem>
                        <SelectItem value="PIPELINE">PIPELINE</SelectItem>
                        <SelectItem value="SHORTLISTED">SHORTLISTED</SelectItem>
                        <SelectItem value="APPROVED">APPROVED</SelectItem>
                        <SelectItem value="REJECTED">REJECTED</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Send Selection Notification Button */}
                  {candidate.email && (
                    <Button
                      onClick={handleSendSelectionNotification}
                      disabled={sendingNotification || candidate.status === 'REJECTED'}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                      data-testid="send-selection-notification-btn"
                    >
                      {sendingNotification ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Selection Notification
                        </>
                      )}
                    </Button>
                  )}
                  
                  {/* Delete Candidate Button - Admin only */}
                  {user?.role === 'admin' && (
                    <Button
                      onClick={handleDeleteCandidate}
                      disabled={deletingCandidate}
                      className="bg-red-600 hover:bg-red-700 text-white"
                      size="sm"
                      data-testid="delete-candidate-btn"
                    >
                      {deletingCandidate ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* AI Story Section */}
        <Card className="mb-6 shadow-xl border-0 overflow-hidden transition-all hover:shadow-2xl">
          <CardHeader
            className="bg-gradient-to-r from-teal-600 to-teal-500 text-white cursor-pointer"
            onClick={() => toggleSection('story')}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6" />
                <CardTitle className="text-xl">AI-Generated Story</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {canEdit && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRegenerateStory();
                    }}
                    disabled={regeneratingStory}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${regeneratingStory ? 'animate-spin' : ''}`} />
                    Regenerate
                  </Button>
                )}
                {expandedSections.story ? <ChevronUp /> : <ChevronDown />}
              </div>
            </div>
          </CardHeader>
          {expandedSections.story && (
            <CardContent className="p-6">
              {candidate.ai_story ? (
                <CandidateStorySection story={candidate.ai_story} />
              ) : (
                <p className="text-gray-500 text-center py-8">No AI story available</p>
              )}
            </CardContent>
          )}
        </Card>

        {/* Parsed Resume Section */}
        <Card className="mb-6 shadow-xl border-0 overflow-hidden transition-all hover:shadow-2xl">
          <CardHeader
            className="bg-gradient-to-r from-blue-700 to-blue-600 text-white cursor-pointer"
            onClick={() => toggleSection('resume')}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6" />
                <CardTitle className="text-xl">Parsed Resume Data</CardTitle>
              </div>
              {expandedSections.resume ? <ChevronUp /> : <ChevronDown />}
            </div>
          </CardHeader>
          {expandedSections.resume && (
            <CardContent className="p-6">
              <CandidateResumeSection
                candidate={candidate}
                canEdit={canEdit}
                onUpdate={fetchCandidateDetails}
              />
            </CardContent>
          )}
        </Card>

        {/* CV Viewer Section - Shows actual file */}
        <Card className="mb-6 shadow-xl border-0 overflow-hidden transition-all hover:shadow-2xl">
          <CardHeader
            className="bg-gradient-to-r from-gray-700 to-gray-600 text-white cursor-pointer"
            onClick={() => toggleSection('cv')}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Eye className="h-6 w-6" />
                <CardTitle className="text-xl">Original Resume</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {candidate.cv_file_url && (
                  <>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        openResumeInNewTab();
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                      data-testid="open-resume-btn"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadResume();
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                      data-testid="download-resume-btn"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </>
                )}
                {expandedSections.cv ? <ChevronUp /> : <ChevronDown />}
              </div>
            </div>
          </CardHeader>
          {expandedSections.cv && (
            <CardContent className="p-6">
              {candidate.cv_file_url ? (
                <div className="border rounded-lg overflow-hidden bg-gray-50">
                  {isPdf ? (
                    <iframe
                      src={`${candidate.cv_file_url.startsWith('http') ? candidate.cv_file_url : BACKEND_URL + candidate.cv_file_url}#toolbar=1`}
                      className="w-full h-[600px]"
                      title="Resume PDF"
                      data-testid="resume-iframe"
                    />
                  ) : isImage ? (
                    <img
                      src={candidate.cv_file_url.startsWith('http') ? candidate.cv_file_url : BACKEND_URL + candidate.cv_file_url}
                      alt="Resume"
                      className="max-w-full h-auto mx-auto"
                      data-testid="resume-image"
                    />
                  ) : (
                    <div className="p-8 text-center">
                      <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600 mb-4">
                        This file format ({fileExtension?.toUpperCase()}) cannot be previewed directly.
                      </p>
                      <div className="flex justify-center gap-4">
                        <Button onClick={openResumeInNewTab} variant="outline">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open in New Tab
                        </Button>
                        <Button onClick={downloadResume}>
                          <Download className="h-4 w-4 mr-2" />
                          Download File
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No resume file available</p>
              )}
            </CardContent>
          )}
        </Card>

        {/* Interview Scheduling Section */}
        <Card className="mb-6 shadow-xl border-0 overflow-hidden transition-all hover:shadow-2xl">
          <CardHeader
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white cursor-pointer"
            onClick={() => toggleSection('interviews')}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6" />
                <CardTitle className="text-xl">Interviews</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {canEdit && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowScheduler(true);
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    data-testid="schedule-interview-btn"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Interview
                  </Button>
                )}
                {expandedSections.interviews ? <ChevronUp /> : <ChevronDown />}
              </div>
            </div>
          </CardHeader>
          {expandedSections.interviews && (
            <CardContent className="p-6">
              <InterviewsList
                key={interviewsKey}
                candidateId={candidate.candidate_id}
                token={token}
              />
            </CardContent>
          )}
        </Card>

        {/* Review & Activity Section */}
        <Card className="mb-6 shadow-xl border-0 overflow-hidden transition-all hover:shadow-2xl">
          <CardHeader
            className="bg-gradient-to-r from-amber-600 to-orange-500 text-white cursor-pointer"
            onClick={() => toggleSection('reviews')}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-6 w-6" />
                <CardTitle className="text-xl">Review & Activity</CardTitle>
              </div>
              {expandedSections.reviews ? <ChevronUp /> : <ChevronDown />}
            </div>
          </CardHeader>
          {expandedSections.reviews && (
            <CardContent className="p-6">
              <ReviewPanel 
                candidateId={candidate.candidate_id} 
                currentStatus={candidate.status}
              />
            </CardContent>
          )}
        </Card>

        {/* Metadata */}
        <div className="text-sm text-gray-600 bg-white p-4 rounded-lg shadow">
          <p><span className="font-medium">Created:</span> {new Date(candidate.created_at).toLocaleString()}</p>
          <p><span className="font-medium">Created by:</span> {candidate.created_by}</p>
        </div>

        {/* Interview Scheduler Dialog */}
        <Dialog open={showScheduler} onOpenChange={setShowScheduler}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Schedule Interview</DialogTitle>
            </DialogHeader>
            <InterviewScheduler
              candidateId={candidate.candidate_id}
              candidateName={candidate.name}
              jobId={candidate.job_id}
              jobTitle={job?.title || 'Position'}
              token={token}
              onScheduled={handleInterviewScheduled}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
