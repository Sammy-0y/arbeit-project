import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Search, 
  Calendar, 
  Clock, 
  Video, 
  Phone, 
  MapPin,
  User,
  Briefcase,
  Building,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STATUS_CONFIG = {
  'Awaiting Candidate Confirmation': { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock },
  'Confirmed': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle },
  'Scheduled': { color: 'bg-green-100 text-green-800 border-green-200', icon: Calendar },
  'Completed': { color: 'bg-teal-100 text-teal-800 border-teal-200', icon: CheckCircle },
  'Passed': { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: ThumbsUp },
  'Failed': { color: 'bg-rose-100 text-rose-800 border-rose-200', icon: ThumbsDown },
  'No Show': { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
  'Cancelled': { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: XCircle }
};

const MODE_ICONS = {
  'Video': Video,
  'Phone': Phone,
  'Onsite': MapPin
};

export const InterviewsListPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token, logout, user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [pipelineStats, setPipelineStats] = useState(null);

  useEffect(() => {
    fetchInterviews();
    fetchPipelineStats();
  }, []);

  useEffect(() => {
    // Update filter when URL changes
    const urlStatus = searchParams.get('status');
    if (urlStatus) {
      setStatusFilter(urlStatus);
    }
  }, [searchParams]);

  const fetchInterviews = async () => {
    try {
      const response = await axios.get(`${API}/interviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInterviews(response.data);
    } catch (error) {
      console.error('Failed to fetch interviews:', error);
      if (error.response?.status === 401) {
        logout();
        navigate('/login');
      } else {
        toast.error('Failed to load interviews');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPipelineStats = async () => {
    try {
      const response = await axios.get(`${API}/interviews/stats/pipeline`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPipelineStats(response.data);
    } catch (error) {
      console.error('Failed to fetch pipeline stats:', error);
    }
  };

  const filteredInterviews = interviews.filter(interview => {
    const matchesSearch = 
      interview.candidate_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || interview.interview_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'Not scheduled';
    try {
      return format(new Date(dateStr), 'MMM dd, yyyy • h:mm a');
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading interviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-900 to-purple-800 text-white p-4 shadow-lg">
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
              <Calendar className="h-5 w-5" />
              All Interviews
            </h1>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white">
            {filteredInterviews.length} interviews
          </Badge>
        </div>
      </header>

      <main className="container mx-auto p-6 max-w-7xl">
        {/* Pipeline Stats */}
        {pipelineStats && (
          <Card className="mb-6 border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4">
              <CardTitle className="text-lg">Interview Pipeline</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {[
                  { status: 'Awaiting Candidate Confirmation', count: pipelineStats.awaiting_confirmation, color: 'amber', label: 'Awaiting' },
                  { status: 'Confirmed', count: pipelineStats.confirmed, color: 'blue', label: 'Confirmed' },
                  { status: 'Scheduled', count: pipelineStats.scheduled, color: 'green', label: 'Scheduled' },
                  { status: 'Completed', count: pipelineStats.completed, color: 'teal', label: 'Completed' },
                  { status: 'No Show', count: pipelineStats.no_shows, color: 'red', label: 'No Show' },
                  { status: 'Cancelled', count: pipelineStats.cancelled, color: 'gray', label: 'Cancelled' }
                ].map(item => (
                  <div 
                    key={item.status}
                    className={`text-center p-3 rounded-lg cursor-pointer transition-all ${
                      statusFilter === item.status 
                        ? `bg-${item.color}-200 ring-2 ring-${item.color}-400` 
                        : `bg-${item.color}-50 hover:bg-${item.color}-100`
                    }`}
                    onClick={() => setStatusFilter(statusFilter === item.status ? 'ALL' : item.status)}
                  >
                    <p className={`text-xl font-bold text-${item.color}-800`}>{item.count}</p>
                    <p className="text-xs text-gray-600">{item.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by candidate, job, or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="search-interviews"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[200px]" data-testid="status-filter">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="Awaiting Candidate Confirmation">Awaiting Confirmation</SelectItem>
                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="No Show">No Show</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interviews List */}
        {filteredInterviews.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No interviews found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'ALL'
                  ? 'Try adjusting your filters'
                  : 'Interviews will appear here once scheduled'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredInterviews.map((interview) => {
              const StatusIcon = STATUS_CONFIG[interview.interview_status]?.icon || AlertCircle;
              const ModeIcon = MODE_ICONS[interview.interview_mode] || Video;
              
              return (
                <Card 
                  key={interview.interview_id}
                  className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                  onClick={() => navigate(`/candidates/${interview.candidate_id}`)}
                  data-testid={`interview-card-${interview.interview_id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Candidate & Job Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                            {interview.candidate_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{interview.candidate_name || 'Unknown'}</h3>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {interview.job_title || 'Unknown Position'}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-1 ml-13">
                          <Building className="h-3 w-3" />
                          {interview.company_name || 'Unknown Company'}
                        </p>
                      </div>

                      {/* Center: Schedule Info */}
                      <div className="flex-1 text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium">
                            {formatDateTime(interview.scheduled_start_time)}
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <ModeIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-500">{interview.interview_mode || 'Video'}</span>
                        </div>
                      </div>

                      {/* Right: Status */}
                      <div className="flex items-center gap-3">
                        <Badge className={`${STATUS_CONFIG[interview.interview_status]?.color || 'bg-gray-100'} flex items-center gap-1`}>
                          <StatusIcon className="h-3 w-3" />
                          {interview.interview_status}
                        </Badge>
                        {interview.invite_sent && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <Send className="h-3 w-3 mr-1" />
                            Invited
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default InterviewsListPage;
