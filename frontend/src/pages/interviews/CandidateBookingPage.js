import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { 
  Calendar, 
  Clock, 
  Video, 
  Phone, 
  MapPin, 
  CheckCircle,
  Building,
  Briefcase,
  User,
  AlertCircle
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MODE_ICONS = {
  'Video': Video,
  'Phone': Phone,
  'Onsite': MapPin
};

const MODE_LABELS = {
  'Video': 'Video Call',
  'Phone': 'Phone Call',
  'Onsite': 'In Person'
};

export const CandidateBookingPage = () => {
  const { interviewId, bookingToken } = useParams();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInterviewDetails();
  }, [interviewId, bookingToken]);

  const fetchInterviewDetails = async () => {
    try {
      // Public endpoint that uses booking token for auth
      const response = await axios.get(`${API}/public/interviews/${interviewId}`, {
        params: { token: bookingToken }
      });
      setInterview(response.data);
      
      // Check if already booked
      if (response.data.interview_status !== 'Awaiting Candidate Confirmation') {
        setBooked(true);
      }
    } catch (error) {
      console.error('Failed to fetch interview:', error);
      setError(error.response?.data?.detail || 'Interview not found or link expired');
    } finally {
      setLoading(false);
    }
  };

  const handleBookSlot = async (slotId) => {
    setBooking(true);
    try {
      await axios.post(
        `${API}/public/interviews/${interviewId}/book`,
        { slot_id: slotId, token: bookingToken }
      );
      
      setBooked(true);
      toast.success('Interview slot confirmed!');
      
      // Refresh to get updated data
      fetchInterviewDetails();
    } catch (error) {
      console.error('Failed to book slot:', error);
      toast.error(error.response?.data?.detail || 'Failed to book slot');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load</h2>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const ModeIcon = MODE_ICONS[interview?.interview_mode] || Video;
  const availableSlots = interview?.proposed_slots?.filter(s => s.is_available) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview Scheduling</h1>
          <p className="text-gray-600">Select your preferred interview slot</p>
        </div>

        {/* Interview Details Card */}
        <Card className="mb-6 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardTitle className="flex items-center gap-3">
              <ModeIcon className="h-6 w-6" />
              {MODE_LABELS[interview?.interview_mode]} Interview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Building className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Company</p>
                  <p className="font-medium text-gray-900">{interview?.company_name || 'Company'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Position</p>
                  <p className="font-medium text-gray-900">{interview?.job_title || 'Position'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium text-gray-900">{interview?.interview_duration} minutes</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Candidate</p>
                  <p className="font-medium text-gray-900">{interview?.candidate_name}</p>
                </div>
              </div>
            </div>

            {interview?.additional_instructions && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-1">Instructions:</p>
                <p className="text-sm text-blue-700">{interview.additional_instructions}</p>
              </div>
            )}

            {interview?.meeting_link && booked && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-1">Meeting Link:</p>
                <a 
                  href={interview.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-700 underline"
                >
                  {interview.meeting_link}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booking Status */}
        {booked && interview?.scheduled_start_time && (
          <Card className="mb-6 shadow-xl border-2 border-green-200">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
              <h2 className="text-2xl font-bold text-green-800 mb-2">Interview Confirmed!</h2>
              <p className="text-gray-600 mb-4">Your interview has been scheduled for:</p>
              <div className="bg-green-50 rounded-lg p-4 inline-block">
                <p className="text-lg font-bold text-green-800">
                  {format(new Date(interview.scheduled_start_time), 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-green-700 flex items-center justify-center gap-2">
                  <Clock className="h-4 w-4" />
                  {format(new Date(interview.scheduled_start_time), 'h:mm a')} ({interview.time_zone})
                </p>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                A calendar invite will be sent to your email shortly.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Available Slots */}
        {!booked && availableSlots.length > 0 && (
          <Card className="shadow-xl">
            <CardHeader className="border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Available Time Slots
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-600 mb-4">
                Please select your preferred time slot. All times are in {interview?.time_zone || 'your local'} timezone.
              </p>
              
              <div className="space-y-3">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.slot_id}
                    onClick={() => handleBookSlot(slot.slot_id)}
                    disabled={booking}
                    className="w-full p-4 border-2 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid={`slot-${slot.slot_id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {format(new Date(slot.start_time), 'EEEE, MMMM d, yyyy')}
                        </p>
                        <p className="text-gray-600 flex items-center gap-2 mt-1">
                          <Clock className="h-4 w-4" />
                          {format(new Date(slot.start_time), 'h:mm a')} - {format(new Date(slot.end_time), 'h:mm a')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {booking ? (
                          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <CheckCircle className="h-6 w-6 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Slots Available */}
        {!booked && availableSlots.length === 0 && (
          <Card className="shadow-xl">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-amber-500" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">No Available Slots</h2>
              <p className="text-gray-600">
                All interview slots have been taken. Please contact the recruiter for alternative times.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CandidateBookingPage;
