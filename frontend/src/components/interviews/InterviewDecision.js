import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  XCircle, 
  Briefcase, 
  Star,
  StarOff,
  ChevronRight,
  AlertTriangle,
  Award,
  MessageSquare
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Scorecard Categories
const SCORECARD_CATEGORIES = [
  { 
    id: 'technical_skills', 
    label: 'Technical Skills', 
    description: 'Knowledge of required technologies and tools'
  },
  { 
    id: 'problem_solving', 
    label: 'Problem Solving', 
    description: 'Analytical thinking and approach to challenges'
  },
  { 
    id: 'communication', 
    label: 'Communication', 
    description: 'Clarity, articulation, and listening skills'
  },
  { 
    id: 'cultural_fit', 
    label: 'Cultural Fit', 
    description: 'Alignment with company values and team dynamics'
  },
  { 
    id: 'experience_relevance', 
    label: 'Experience Relevance', 
    description: 'How well past experience matches the role'
  }
];

// Star Rating Component
const StarRating = ({ value, onChange, disabled }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !disabled && onChange(star)}
          disabled={disabled}
          className={`transition-all ${disabled ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
        >
          {star <= value ? (
            <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
          ) : (
            <StarOff className="h-6 w-6 text-gray-300" />
          )}
        </button>
      ))}
    </div>
  );
};

// Interview Decision Dialog Component
export const InterviewDecisionDialog = ({ 
  interview, 
  isOpen, 
  onClose, 
  onSuccess,
  token 
}) => {
  const [decisionType, setDecisionType] = useState(null); // 'pass', 'fail', 'hire'
  const [loading, setLoading] = useState(false);
  
  // Scorecard state
  const [scorecard, setScorecard] = useState({
    technical_skills: 0,
    problem_solving: 0,
    communication: 0,
    cultural_fit: 0,
    experience_relevance: 0
  });
  const [overallRating, setOverallRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [nextRoundName, setNextRoundName] = useState('');
  
  // Hiring specific fields
  const [salaryOffered, setSalaryOffered] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [offerNotes, setOfferNotes] = useState('');

  const calculateAverageScore = () => {
    const scores = Object.values(scorecard).filter(s => s > 0);
    if (scores.length === 0) return 0;
    return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
  };

  const handleSubmit = async () => {
    if (overallRating === 0) {
      toast.error('Please provide an overall rating');
      return;
    }

    setLoading(true);
    
    // Build comprehensive feedback from scorecard
    const scorecardFeedback = SCORECARD_CATEGORIES
      .filter(cat => scorecard[cat.id] > 0)
      .map(cat => `${cat.label}: ${scorecard[cat.id]}/5`)
      .join(', ');
    
    const fullFeedback = [
      feedback,
      strengths ? `Strengths: ${strengths}` : '',
      improvements ? `Areas for improvement: ${improvements}` : '',
      scorecardFeedback ? `Scorecard: ${scorecardFeedback}` : ''
    ].filter(Boolean).join('\n\n');

    try {
      let endpoint = '';
      let payload = {};

      if (decisionType === 'pass') {
        endpoint = `/api/interviews/${interview.interview_id}/move-to-next-round`;
        payload = {
          feedback: fullFeedback,
          rating: overallRating,
          next_round_name: nextRoundName || `Round ${(interview.interview_round || 1) + 1}`
        };
      } else if (decisionType === 'fail') {
        endpoint = `/api/interviews/${interview.interview_id}/reject`;
        payload = {
          feedback: fullFeedback,
          rating: overallRating
        };
      } else if (decisionType === 'hire') {
        endpoint = `/api/interviews/${interview.interview_id}/initiate-hiring`;
        payload = {
          feedback: fullFeedback,
          rating: overallRating,
          salary_offered: salaryOffered,
          joining_date: joiningDate,
          offer_notes: offerNotes
        };
      }

      const response = await axios.post(`${BACKEND_URL}${endpoint}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(response.data.message);
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit decision');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDecisionType(null);
    setScorecard({
      technical_skills: 0,
      problem_solving: 0,
      communication: 0,
      cultural_fit: 0,
      experience_relevance: 0
    });
    setOverallRating(0);
    setFeedback('');
    setStrengths('');
    setImprovements('');
    setNextRoundName('');
    setSalaryOffered('');
    setJoiningDate('');
    setOfferNotes('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { resetForm(); onClose(); }}}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-600" />
            Interview Decision - Round {interview?.interview_round || 1}
          </DialogTitle>
          <DialogDescription>
            Record your assessment for {interview?.candidate_name || 'Candidate'}
          </DialogDescription>
        </DialogHeader>

        {!decisionType ? (
          // Decision Selection Screen
          <div className="py-6 space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Select the outcome of this interview:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-green-500"
                onClick={() => setDecisionType('pass')}
              >
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-green-700">Pass</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Move to next round
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-red-500"
                onClick={() => setDecisionType('fail')}
              >
                <CardContent className="p-6 text-center">
                  <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-red-700">Reject</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    End candidature
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-blue-500"
                onClick={() => setDecisionType('hire')}
              >
                <CardContent className="p-6 text-center">
                  <Briefcase className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-blue-700">Initiate Hiring</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Start offer process
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          // Scorecard Form
          <div className="py-4 space-y-6">
            {/* Decision Badge */}
            <div className="flex items-center justify-between">
              <Badge 
                className={
                  decisionType === 'pass' ? 'bg-green-100 text-green-800' :
                  decisionType === 'fail' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }
              >
                {decisionType === 'pass' ? 'Passing to Next Round' :
                 decisionType === 'fail' ? 'Rejecting Candidate' :
                 'Initiating Hiring'}
              </Badge>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setDecisionType(null)}
              >
                Change Decision
              </Button>
            </div>

            {/* Scorecard Categories */}
            <Card className="bg-gray-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Interview Scorecard
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {SCORECARD_CATEGORIES.map((category) => (
                  <div key={category.id} className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">{category.label}</Label>
                      <p className="text-xs text-gray-500">{category.description}</p>
                    </div>
                    <StarRating
                      value={scorecard[category.id]}
                      onChange={(val) => setScorecard(prev => ({ ...prev, [category.id]: val }))}
                    />
                  </div>
                ))}
                
                {/* Average Score Display */}
                <div className="pt-2 border-t flex items-center justify-between">
                  <span className="font-semibold text-gray-700">Average Score</span>
                  <span className="text-lg font-bold text-blue-600">
                    {calculateAverageScore()}/5
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Overall Rating */}
            <div className="space-y-2">
              <Label className="font-semibold">Overall Rating *</Label>
              <div className="flex items-center gap-4">
                <StarRating value={overallRating} onChange={setOverallRating} />
                <span className="text-sm text-gray-500">
                  {overallRating > 0 ? `${overallRating}/5` : 'Select rating'}
                </span>
              </div>
            </div>

            {/* Feedback */}
            <div className="space-y-2">
              <Label>Overall Feedback</Label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Write your overall assessment of the candidate..."
                rows={3}
              />
            </div>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Key Strengths</Label>
                <Textarea
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                  placeholder="What stood out positively..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Areas for Improvement</Label>
                <Textarea
                  value={improvements}
                  onChange={(e) => setImprovements(e.target.value)}
                  placeholder="What could be better..."
                  rows={2}
                />
              </div>
            </div>

            {/* Pass-specific: Next Round Name */}
            {decisionType === 'pass' && (
              <div className="space-y-2 p-4 bg-green-50 rounded-lg">
                <Label>Next Round Name (Optional)</Label>
                <input
                  type="text"
                  value={nextRoundName}
                  onChange={(e) => setNextRoundName(e.target.value)}
                  placeholder={`e.g., Technical Round ${(interview?.interview_round || 1) + 1}, HR Round`}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            )}

            {/* Hire-specific: Offer Details */}
            {decisionType === 'hire' && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Offer Details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Salary Offered</Label>
                    <input
                      type="text"
                      value={salaryOffered}
                      onChange={(e) => setSalaryOffered(e.target.value)}
                      placeholder="e.g., 15 LPA"
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expected Joining Date</Label>
                    <input
                      type="date"
                      value={joiningDate}
                      onChange={(e) => setJoiningDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Offer Notes</Label>
                  <Textarea
                    value={offerNotes}
                    onChange={(e) => setOfferNotes(e.target.value)}
                    placeholder="Any additional notes about the offer..."
                    rows={2}
                  />
                </div>
              </div>
            )}

            {/* Reject Warning */}
            {decisionType === 'fail' && (
              <div className="p-4 bg-red-50 rounded-lg flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Candidate will be rejected</p>
                  <p className="text-sm text-red-600">
                    This will mark the candidate as rejected and end their candidature for this position.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {decisionType && (
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDecisionType(null)}>
              Back
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={loading || overallRating === 0}
              className={
                decisionType === 'pass' ? 'bg-green-600 hover:bg-green-700' :
                decisionType === 'fail' ? 'bg-red-600 hover:bg-red-700' :
                'bg-blue-600 hover:bg-blue-700'
              }
            >
              {loading ? 'Submitting...' : (
                decisionType === 'pass' ? 'Confirm Pass' :
                decisionType === 'fail' ? 'Confirm Rejection' :
                'Initiate Hiring'
              )}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Interview History Component
export const InterviewHistory = ({ interviews }) => {
  if (!interviews || interviews.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        No interview history yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {interviews.map((interview, index) => (
        <div 
          key={interview.interview_id}
          className={`flex items-center gap-4 p-3 rounded-lg ${
            interview.status === 'Passed' ? 'bg-green-50' :
            interview.status === 'Failed' ? 'bg-red-50' :
            'bg-gray-50'
          }`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
            interview.status === 'Passed' ? 'bg-green-500' :
            interview.status === 'Failed' ? 'bg-red-500' :
            'bg-blue-500'
          }`}>
            {interview.round}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{interview.round_name}</span>
              <Badge className={
                interview.status === 'Passed' ? 'bg-green-100 text-green-800' :
                interview.status === 'Failed' ? 'bg-red-100 text-red-800' :
                interview.status === 'Completed' ? 'bg-amber-100 text-amber-800' :
                'bg-blue-100 text-blue-800'
              }>
                {interview.status}
              </Badge>
            </div>
            <p className="text-sm text-gray-500">
              {interview.scheduled_time ? new Date(interview.scheduled_time).toLocaleDateString() : 'Not scheduled'} 
              {' • '}{interview.interview_mode}
            </p>
            {interview.feedback && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                {interview.feedback}
              </p>
            )}
          </div>
          {interview.rating && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{interview.rating}/5</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default InterviewDecisionDialog;
