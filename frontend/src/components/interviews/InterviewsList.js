import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import axios from 'axios';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { toast } from 'sonner';
import { 
  Calendar, 
  Clock, 
  Video, 
  Phone, 
  MapPin, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  MoreHorizontal,
  Eye,
  Link,
  Copy,
  Mail,
  Award,
  ThumbsUp,
  ThumbsDown,
  Briefcase
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../ui/dropdown-menu';
import { InterviewDecisionDialog } from './InterviewDecision';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STATUS_CONFIG = {
  'Awaiting Candidate Confirmation': { 
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: Clock 
  },
  'Confirmed': { 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CheckCircle 
  },
  'Scheduled': { 
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: Calendar 
  },
  'Completed': { 
    color: 'bg-teal-100 text-teal-800 border-teal-200',
    icon: CheckCircle 
  },
  'Passed': { 
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: ThumbsUp 
  },
  'Failed': { 
    color: 'bg-rose-100 text-rose-800 border-rose-200',
    icon: ThumbsDown 
  },
  'No Show': { 
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle 
  },
  'Cancelled': { 
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: XCircle 
  }
};

const MODE_ICONS = {
  'Video': Video,
  'Phone': Phone,
  'Onsite': MapPin
};

export const InterviewsList = ({ 
  candidateId, 
  token, 
  onViewInterview,
  compact = false 
}) => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showDecisionDialog, setShowDecisionDialog] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [inviteData, setInviteData] = useState({
    meeting_link: '',
    interview_mode: 'Video',
    duration_minutes: 30,
    time_zone: 'IST (Indian Standard Time)',
    auto_create_calendar_event: false
  });
  const [sendingInvite, setSendingInvite] = useState(false);

  useEffect(() => {
    fetchInterviews();
  }, [candidateId]);

  const fetchInterviews = async () => {
    try {
      const response = await axios.get(
        `${API}/candidates/${candidateId}/interviews`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInterviews(response.data);
    } catch (error) {
      console.error('Failed to fetch interviews:', error);
      toast.error('Failed to load interviews');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (interviewId, action) => {
    try {
      let endpoint = '';
      let successMessage = '';

      switch (action) {
        case 'send-invite':
          // Open dialog instead of directly sending
          const interview = interviews.find(i => i.interview_id === interviewId);
          setSelectedInterview(interview);
          setShowInviteDialog(true);
          return;
        case 'complete':
          endpoint = `${API}/interviews/${interviewId}/mark-completed`;
          successMessage = 'Interview marked as completed';
          break;
        case 'no-show':
          endpoint = `${API}/interviews/${interviewId}/mark-no-show`;
          successMessage = 'Interview marked as no-show';
          break;
        case 'cancel':
          endpoint = `${API}/interviews/${interviewId}/cancel`;
          successMessage = 'Interview cancelled';
          break;
        default:
          return;
      }

      await axios.post(endpoint, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(successMessage);
      fetchInterviews();
    } catch (error) {
      console.error(`Failed to ${action} interview:`, error);
      toast.error(error.response?.data?.detail || `Failed to ${action} interview`);
    }
  };

  const handleSendInvite = async () => {
    if (!selectedInterview) return;
    
    setSendingInvite(true);
    try {
      const response = await axios.post(
        `${API}/interviews/${selectedInterview.interview_id}/send-invite`,
        inviteData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.email_sent) {
        toast.success(`Interview invitation sent to candidate!`);
        if (response.data.calendar_event_created) {
          toast.success('Google Calendar event created with meeting link');
        }
      } else {
        toast.warning('Invitation created but email delivery may have failed');
      }
      
      setShowInviteDialog(false);
      setSelectedInterview(null);
      setInviteData({
        meeting_link: '',
        interview_mode: 'Video',
        duration_minutes: 30,
        time_zone: 'IST (Indian Standard Time)',
        auto_create_calendar_event: false
      });
      fetchInterviews();
    } catch (error) {
      console.error('Failed to send invite:', error);
      toast.error(error.response?.data?.detail || 'Failed to send interview invitation');
    } finally {
      setSendingInvite(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (interviews.length === 0) {
    return (
      <div className="text-center py-8" data-testid="no-interviews">
        <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500">No interviews scheduled</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="interviews-list">
      {interviews.map((interview) => {
        const StatusIcon = STATUS_CONFIG[interview.interview_status]?.icon || AlertCircle;
        const ModeIcon = MODE_ICONS[interview.interview_mode] || Video;
        const statusConfig = STATUS_CONFIG[interview.interview_status] || STATUS_CONFIG['Awaiting Candidate Confirmation'];

        return (
          <Card 
            key={interview.interview_id} 
            className={`overflow-hidden transition-all hover:shadow-md ${compact ? 'p-2' : ''}`}
            data-testid={`interview-card-${interview.interview_id}`}
          >
            <div className={`flex items-center justify-between ${compact ? 'px-3 py-2' : 'p-4'}`}>
              <div className="flex items-center gap-4">
                {/* Round Number Badge */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                  interview.interview_status === 'Passed' ? 'bg-green-500' :
                  interview.interview_status === 'Failed' ? 'bg-red-500' :
                  'bg-blue-600'
                }`}>
                  R{interview.interview_round || 1}
                </div>

                {/* Details */}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">
                      {interview.round_name || `Round ${interview.interview_round || 1}`}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      <ModeIcon className="h-3 w-3 mr-1" />
                      {interview.interview_mode}
                    </Badge>
                    <Badge className={`border ${statusConfig.color}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {interview.interview_status}
                    </Badge>
                  </div>
                  
                  {interview.scheduled_start_time ? (
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(interview.scheduled_start_time), 'EEE, MMM d, yyyy')}
                      <span className="mx-1">•</span>
                      <Clock className="h-3 w-3" />
                      {format(new Date(interview.scheduled_start_time), 'h:mm a')}
                    </p>
                  ) : (
                    <p className="text-sm text-amber-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      Awaiting slot selection
                    </p>
                  )}
                  
                  {/* Show feedback/rating if available */}
                  {interview.rating && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      Rating: {'⭐'.repeat(interview.rating)}
                      {interview.feedback && ` - ${interview.feedback.substring(0, 50)}...`}
                    </p>
                  )}
                  
                  {!compact && !interview.rating && (
                    <p className="text-xs text-gray-400 mt-1">
                      Created {format(new Date(interview.created_at), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {onViewInterview && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewInterview(interview)}
                    data-testid={`view-interview-${interview.interview_id}`}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {interview.interview_status === 'Awaiting Candidate Confirmation' && (
                      <DropdownMenuItem onClick={async () => {
                        try {
                          const response = await axios.get(
                            `${API}/interviews/${interview.interview_id}/booking-link`,
                            { headers: { Authorization: `Bearer ${token}` } }
                          );
                          await navigator.clipboard.writeText(response.data.booking_link);
                          toast.success('Booking link copied to clipboard!');
                        } catch (error) {
                          toast.error('Failed to get booking link');
                        }
                      }}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Booking Link
                      </DropdownMenuItem>
                    )}
                    {interview.interview_status === 'Confirmed' && !interview.invite_sent && (
                      <DropdownMenuItem onClick={() => handleAction(interview.interview_id, 'send-invite')}>
                        <Send className="h-4 w-4 mr-2" />
                        Send Invite
                      </DropdownMenuItem>
                    )}
                    {['Scheduled', 'Confirmed'].includes(interview.interview_status) && (
                      <>
                        <DropdownMenuItem onClick={() => handleAction(interview.interview_id, 'complete')}>
                          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                          Mark Completed
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction(interview.interview_id, 'no-show')}>
                          <XCircle className="h-4 w-4 mr-2 text-red-600" />
                          Mark No-Show
                        </DropdownMenuItem>
                      </>
                    )}
                    {['Completed', 'Scheduled'].includes(interview.interview_status) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedInterview(interview);
                            setShowDecisionDialog(true);
                          }}
                          className="text-blue-600 font-medium"
                        >
                          <Award className="h-4 w-4 mr-2" />
                          Record Decision (Pass/Fail/Hire)
                        </DropdownMenuItem>
                      </>
                    )}
                    {!['Completed', 'No Show', 'Cancelled', 'Passed', 'Failed'].includes(interview.interview_status) && (
                      <DropdownMenuItem 
                        onClick={() => handleAction(interview.interview_id, 'cancel')}
                        className="text-red-600"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel Interview
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </Card>
        );
      })}

      {/* Interview Decision Dialog */}
      <InterviewDecisionDialog
        interview={selectedInterview}
        isOpen={showDecisionDialog}
        onClose={() => {
          setShowDecisionDialog(false);
          setSelectedInterview(null);
        }}
        onSuccess={fetchInterviews}
        token={token}
      />

      {/* Send Interview Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Send Interview Invitation
            </DialogTitle>
            <DialogDescription>
              Send an interview invitation email to the candidate with meeting details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Interview Mode */}
            <div className="space-y-2">
              <Label>Interview Mode</Label>
              <Select 
                value={inviteData.interview_mode}
                onValueChange={(value) => setInviteData(prev => ({ ...prev, interview_mode: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Video">Video Call</SelectItem>
                  <SelectItem value="Phone">Phone Call</SelectItem>
                  <SelectItem value="Onsite">In Person</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select 
                value={inviteData.duration_minutes.toString()}
                onValueChange={(value) => setInviteData(prev => ({ ...prev, duration_minutes: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time Zone */}
            <div className="space-y-2">
              <Label>Time Zone</Label>
              <Select 
                value={inviteData.time_zone}
                onValueChange={(value) => setInviteData(prev => ({ ...prev, time_zone: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IST (Indian Standard Time)">IST (Indian Standard Time)</SelectItem>
                  <SelectItem value="EST (Eastern Standard Time)">EST (Eastern Standard Time)</SelectItem>
                  <SelectItem value="PST (Pacific Standard Time)">PST (Pacific Standard Time)</SelectItem>
                  <SelectItem value="GMT (Greenwich Mean Time)">GMT (Greenwich Mean Time)</SelectItem>
                  <SelectItem value="CET (Central European Time)">CET (Central European Time)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Meeting Link (Manual Entry) */}
            <div className="space-y-2">
              <Label>Meeting Link (Optional)</Label>
              <Input
                placeholder="https://meet.google.com/xxx-xxxx-xxx or Zoom link"
                value={inviteData.meeting_link}
                onChange={(e) => setInviteData(prev => ({ ...prev, meeting_link: e.target.value }))}
              />
              <p className="text-xs text-gray-500">Leave empty if you want to auto-generate via Google Calendar</p>
            </div>

            {/* Auto-create Calendar Event */}
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
              <Checkbox
                id="auto-calendar"
                checked={inviteData.auto_create_calendar_event}
                onCheckedChange={(checked) => setInviteData(prev => ({ 
                  ...prev, 
                  auto_create_calendar_event: checked,
                  meeting_link: checked ? '' : prev.meeting_link
                }))}
              />
              <div className="flex-1">
                <Label htmlFor="auto-calendar" className="cursor-pointer">
                  Auto-create Google Calendar event with Meet link
                </Label>
                <p className="text-xs text-gray-500">
                  Creates a calendar event and generates a Google Meet link automatically
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendInvite}
              disabled={sendingInvite || (!inviteData.meeting_link && !inviteData.auto_create_calendar_event)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sendingInvite ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
