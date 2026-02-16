import React, { useState, useEffect } from 'react';
import { format, addDays, startOfDay, setHours, setMinutes, isBefore, isAfter, isSameDay } from 'date-fns';
import { Calendar } from '../ui/calendar';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Video, 
  Phone, 
  MapPin, 
  Plus, 
  Trash2, 
  Send,
  Check,
  X
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Time slots from 9 AM to 6 PM
const TIME_SLOTS = Array.from({ length: 19 }, (_, i) => {
  const hour = Math.floor(i / 2) + 9;
  const minutes = (i % 2) * 30;
  return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
});

const DURATIONS = [
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' }
];

const INTERVIEW_MODES = [
  { value: 'Video', label: 'Video Call', icon: Video },
  { value: 'Phone', label: 'Phone Call', icon: Phone },
  { value: 'Onsite', label: 'In Person', icon: MapPin }
];

export const InterviewScheduler = ({ 
  candidateId, 
  candidateName,
  jobId, 
  jobTitle,
  token, 
  onScheduled,
  existingInterview = null
}) => {
  const [selectedDate, setSelectedDate] = useState(addDays(new Date(), 1));
  const [proposedSlots, setProposedSlots] = useState([]);
  const [interviewMode, setInterviewMode] = useState('Video');
  const [duration, setDuration] = useState(60);
  const [meetingLink, setMeetingLink] = useState('');
  const [instructions, setInstructions] = useState('');
  const [timeZone, setTimeZone] = useState('Asia/Kolkata');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddSlotDialog, setShowAddSlotDialog] = useState(false);
  const [selectedTime, setSelectedTime] = useState('10:00');

  // For booking mode
  const isBookingMode = existingInterview !== null;

  const handleAddSlot = () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select both date and time');
      return;
    }

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const slotStart = setMinutes(setHours(startOfDay(selectedDate), hours), minutes);
    const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);

    // Check if slot is in the past
    if (isBefore(slotStart, new Date())) {
      toast.error('Cannot schedule slots in the past');
      return;
    }

    // Check for duplicates
    const isDuplicate = proposedSlots.some(slot => 
      slot.start_time === slotStart.toISOString()
    );

    if (isDuplicate) {
      toast.error('This slot is already added');
      return;
    }

    // Max 5 slots
    if (proposedSlots.length >= 5) {
      toast.error('Maximum 5 slots allowed');
      return;
    }

    setProposedSlots(prev => [...prev, {
      id: Date.now(),
      start_time: slotStart.toISOString(),
      end_time: slotEnd.toISOString(),
      date: selectedDate,
      time: selectedTime
    }]);

    setShowAddSlotDialog(false);
    toast.success('Slot added');
  };

  const handleRemoveSlot = (slotId) => {
    setProposedSlots(prev => prev.filter(slot => slot.id !== slotId));
  };

  const handleSubmit = async () => {
    if (proposedSlots.length === 0) {
      toast.error('Please add at least one time slot');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        job_id: jobId,
        candidate_id: candidateId,
        interview_mode: interviewMode,
        interview_duration: duration,
        time_zone: timeZone,
        proposed_slots: proposedSlots.map(slot => ({
          start_time: slot.start_time,
          end_time: slot.end_time
        })),
        meeting_link: meetingLink || null,
        additional_instructions: instructions || null
      };

      const response = await axios.post(`${API}/interviews`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Interview scheduled successfully!');
      onScheduled?.(response.data);
    } catch (error) {
      console.error('Failed to schedule interview:', error);
      toast.error(error.response?.data?.detail || 'Failed to schedule interview');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookSlot = async (slotId) => {
    if (!existingInterview) return;

    setIsSubmitting(true);

    try {
      const response = await axios.post(
        `${API}/interviews/${existingInterview.interview_id}/book-slot`,
        { slot_id: slotId, confirmed: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Interview slot confirmed!');
      onScheduled?.(response.data);
    } catch (error) {
      console.error('Failed to book slot:', error);
      toast.error(error.response?.data?.detail || 'Failed to book slot');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Highlight dates with proposed slots
  const datesWithSlots = proposedSlots.map(slot => startOfDay(new Date(slot.date)));

  return (
    <div className="space-y-6" data-testid="interview-scheduler">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {isBookingMode ? 'Select Interview Slot' : 'Schedule Interview'}
          </h3>
          <p className="text-sm text-gray-500">
            {isBookingMode 
              ? `Choose your preferred slot for ${candidateName}`
              : `Propose time slots for ${candidateName}`
            }
          </p>
        </div>
        <Badge variant="outline" className="text-blue-600 border-blue-200">
          {jobTitle}
        </Badge>
      </div>

      {/* Booking Mode - Show existing slots */}
      {isBookingMode && existingInterview.proposed_slots && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Available Slots
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {existingInterview.proposed_slots
                .filter(slot => slot.is_available)
                .map((slot) => (
                  <button
                    key={slot.slot_id}
                    onClick={() => handleBookSlot(slot.slot_id)}
                    disabled={isSubmitting}
                    className="p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                    data-testid={`slot-${slot.slot_id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {format(new Date(slot.start_time), 'EEEE, MMMM d, yyyy')}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(slot.start_time), 'h:mm a')} - {format(new Date(slot.end_time), 'h:mm a')}
                        </p>
                      </div>
                      <Check className="h-5 w-5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
            </div>
            {existingInterview.proposed_slots.filter(s => s.is_available).length === 0 && (
              <p className="text-center text-gray-500 py-4">No available slots</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Scheduling Mode */}
      {!isBookingMode && (
        <>
          {/* Interview Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Interview Mode</Label>
              <Select value={interviewMode} onValueChange={setInterviewMode}>
                <SelectTrigger data-testid="interview-mode-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERVIEW_MODES.map(mode => (
                    <SelectItem key={mode.value} value={mode.value}>
                      <div className="flex items-center gap-2">
                        <mode.icon className="h-4 w-4" />
                        {mode.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Duration</Label>
              <Select value={duration.toString()} onValueChange={(v) => setDuration(parseInt(v))}>
                <SelectTrigger data-testid="duration-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map(d => (
                    <SelectItem key={d.value} value={d.value.toString()}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Time Zone</Label>
              <Select value={timeZone} onValueChange={setTimeZone}>
                <SelectTrigger data-testid="timezone-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                  <SelectItem value="America/New_York">US Eastern</SelectItem>
                  <SelectItem value="America/Los_Angeles">US Pacific</SelectItem>
                  <SelectItem value="Europe/London">UK (GMT/BST)</SelectItem>
                  <SelectItem value="Europe/Berlin">Central Europe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Calendar and Slots */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calendar */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Select Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => isBefore(date, startOfDay(new Date()))}
                  modifiers={{
                    hasSlot: datesWithSlots
                  }}
                  modifiersStyles={{
                    hasSlot: { 
                      backgroundColor: '#dbeafe',
                      borderRadius: '50%'
                    }
                  }}
                  className="rounded-md border"
                />
                <div className="mt-4">
                  <Button 
                    onClick={() => setShowAddSlotDialog(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={!selectedDate}
                    data-testid="add-slot-button"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Time Slot for {selectedDate && format(selectedDate, 'MMM d')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Proposed Slots */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Proposed Slots
                  </span>
                  <Badge variant="secondary">{proposedSlots.length}/5</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {proposedSlots.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No slots added yet</p>
                    <p className="text-sm">Select a date and add time slots</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {proposedSlots.map((slot, index) => (
                      <div 
                        key={slot.id}
                        className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100"
                        data-testid={`proposed-slot-${index}`}
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {format(new Date(slot.start_time), 'EEE, MMM d')}
                          </p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(slot.start_time), 'h:mm a')} - {format(new Date(slot.end_time), 'h:mm a')}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSlot(slot.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Meeting Link and Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Meeting Link (optional)</Label>
              <Input
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/..."
                data-testid="meeting-link-input"
              />
            </div>
            <div>
              <Label>Additional Instructions (optional)</Label>
              <Textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Any special instructions for the candidate..."
                rows={2}
                data-testid="instructions-textarea"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={proposedSlots.length === 0 || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="schedule-interview-button"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Schedule Interview
                </>
              )}
            </Button>
          </div>
        </>
      )}

      {/* Add Slot Dialog */}
      <Dialog open={showAddSlotDialog} onOpenChange={setShowAddSlotDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Time Slot</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">
              {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </p>
            <Label>Select Time</Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger data-testid="time-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {TIME_SLOTS.map(time => (
                  <SelectItem key={time} value={time}>
                    {format(setHours(setMinutes(new Date(), parseInt(time.split(':')[1])), parseInt(time.split(':')[0])), 'h:mm a')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 mt-2">
              Duration: {duration} minutes
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSlotDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSlot} data-testid="confirm-add-slot">
              Add Slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
