import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCandidateAuth } from '../../contexts/CandidateAuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  Video, 
  Phone, 
  MapPin, 
  LogOut,
  User,
  Briefcase,
  Building,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const STATUS_CONFIG = {
  'Awaiting Candidate Confirmation': { 
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: Clock,
    action: true
  },
  'Confirmed': { 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CheckCircle,
    action: false
  },
  'Scheduled': { 
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: Calendar,
    action: false
  },
  'Completed': { 
    color: 'bg-teal-100 text-teal-800 border-teal-200',
    icon: CheckCircle,
    action: false
  },
  'No Show': { 
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
    action: false
  },
  'Cancelled': { 
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: XCircle,
    action: false
  }
};

const MODE_ICONS = {
  'Video': Video,
  'Phone': Phone,
  'Onsite': MapPin
};

export const CandidateDashboard = () => {
  const navigate = useNavigate();
  const { candidate, token, logout } = useCandidateAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState(null);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/candidate-portal/my-interviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setInterviews(data);
      } else {
        toast.error('Failed to load interviews');
      }
    } catch (error) {
      console.error('Failed to fetch interviews:', error);
      toast.error('Failed to load interviews');
    } finally {
      setLoading(false);
    }
  };

  const handleBookSlot = async (interviewId, slotId) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/candidate-portal/interviews/${interviewId}/book-slot?slot_id=${slotId}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.ok) {
        toast.success('Interview slot confirmed!');
        setSelectedInterview(null);
        fetchInterviews();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to book slot');
      }
    } catch (error) {
      console.error('Failed to book slot:', error);
      toast.error('Failed to book slot');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/candidate/login');
  };

  const pendingInterviews = interviews.filter(i => i.interview_status === 'Awaiting Candidate Confirmation');
  const upcomingInterviews = interviews.filter(i => ['Confirmed', 'Scheduled'].includes(i.interview_status));
  const pastInterviews = interviews.filter(i => ['Completed', 'No Show', 'Cancelled'].includes(i.interview_status));

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <nav className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Arbeit Talent Portal</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <span className="text-sm">{candidate?.name}</span>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              data-testid="logout-button"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-6 max-w-4xl">
        {/* Welcome Section */}
        <Card className="mb-6 border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 text-white">
            <h2 className="text-2xl font-bold mb-1">Welcome, {candidate?.name}!</h2>
            <p className="text-indigo-100">Manage your interview schedule below</p>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-amber-50 rounded-lg">
                <Clock className="h-8 w-8 mx-auto mb-2 text-amber-600" />
                <p className="text-2xl font-bold text-amber-800">{pendingInterviews.length}</p>
                <p className="text-sm text-gray-600">Pending Action</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold text-green-800">{upcomingInterviews.length}</p>
                <p className="text-sm text-gray-600">Upcoming</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                <p className="text-2xl font-bold text-gray-800">{pastInterviews.length}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : interviews.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Interviews Yet</h3>
              <p className="text-gray-500">
                When a recruiter schedules an interview with you, it will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Pending Action Interviews */}
            {pendingInterviews.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  Action Required ({pendingInterviews.length})
                </h3>
                <div className="space-y-4">
                  {pendingInterviews.map((interview) => (
                    <InterviewCard 
                      key={interview.interview_id}
                      interview={interview}
                      onSelect={() => setSelectedInterview(interview)}
                      showAction
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Interviews */}
            {upcomingInterviews.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-500" />
                  Upcoming Interviews ({upcomingInterviews.length})
                </h3>
                <div className="space-y-4">
                  {upcomingInterviews.map((interview) => (
                    <InterviewCard 
                      key={interview.interview_id}
                      interview={interview}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Past Interviews */}
            {pastInterviews.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-gray-500" />
                  Past Interviews ({pastInterviews.length})
                </h3>
                <div className="space-y-4">
                  {pastInterviews.map((interview) => (
                    <InterviewCard 
                      key={interview.interview_id}
                      interview={interview}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Slot Selection Modal */}
        {selectedInterview && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <CardTitle>Select Interview Slot</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-4">
                  <p className="font-semibold text-gray-800">{selectedInterview.job_title}</p>
                  <p className="text-sm text-gray-600">{selectedInterview.company_name}</p>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  Please select your preferred interview slot:
                </p>

                <div className="space-y-3">
                  {selectedInterview.proposed_slots
                    ?.filter(slot => slot.is_available)
                    .map((slot) => (
                      <button
                        key={slot.slot_id}
                        onClick={() => handleBookSlot(selectedInterview.interview_id, slot.slot_id)}
                        className="w-full p-4 border-2 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {format(new Date(slot.start_time), 'EEEE, MMMM d, yyyy')}
                            </p>
                            <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                              <Clock className="h-4 w-4" />
                              {format(new Date(slot.start_time), 'h:mm a')} - {format(new Date(slot.end_time), 'h:mm a')}
                            </p>
                          </div>
                          <CheckCircle className="h-5 w-5 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedInterview(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

// Interview Card Component
const InterviewCard = ({ interview, onSelect, showAction }) => {
  const statusConfig = STATUS_CONFIG[interview.interview_status] || STATUS_CONFIG['Awaiting Candidate Confirmation'];
  const StatusIcon = statusConfig.icon;
  const ModeIcon = MODE_ICONS[interview.interview_mode] || Video;

  return (
    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow overflow-hidden">
      <div className="flex">
        {/* Left Color Bar */}
        <div className={`w-2 ${interview.interview_status === 'Awaiting Candidate Confirmation' ? 'bg-amber-500' : 
          interview.interview_status === 'Confirmed' || interview.interview_status === 'Scheduled' ? 'bg-green-500' : 'bg-gray-400'}`} />
        
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Company & Job */}
              <div className="flex items-center gap-2 mb-2">
                <Building className="h-4 w-4 text-gray-400" />
                <span className="font-semibold text-gray-800">{interview.company_name}</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{interview.job_title}</span>
              </div>

              {/* Interview Details */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-gray-600">
                  <ModeIcon className="h-4 w-4" />
                  <span>{interview.interview_mode}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{interview.interview_duration} min</span>
                </div>
              </div>

              {/* Scheduled Time */}
              {interview.scheduled_start_time && (
                <div className="mt-3 p-2 bg-green-50 rounded-lg inline-block">
                  <p className="text-sm font-medium text-green-800">
                    {format(new Date(interview.scheduled_start_time), 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-sm text-green-700">
                    {format(new Date(interview.scheduled_start_time), 'h:mm a')}
                  </p>
                </div>
              )}

              {/* Meeting Link */}
              {interview.meeting_link && ['Confirmed', 'Scheduled'].includes(interview.interview_status) && (
                <div className="mt-3">
                  <a 
                    href={interview.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:text-indigo-800 underline"
                  >
                    Join Meeting →
                  </a>
                </div>
              )}
            </div>

            {/* Right Side - Status & Action */}
            <div className="flex flex-col items-end gap-2">
              <Badge className={`border ${statusConfig.color}`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {interview.interview_status}
              </Badge>

              {showAction && interview.interview_status === 'Awaiting Candidate Confirmation' && (
                <Button
                  onClick={onSelect}
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                >
                  Select Slot
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CandidateDashboard;
