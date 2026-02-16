import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { CheckCircle, Clock, XCircle, MessageCircle, Send } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const actionIcons = {
  APPROVE: { icon: CheckCircle, color: 'text-teal-500', label: 'Approved' },
  PIPELINE: { icon: Clock, color: 'text-yellow-500', label: 'Moved to Pipeline' },
  REJECT: { icon: XCircle, color: 'text-red-500', label: 'Rejected' },
  COMMENT: { icon: MessageCircle, color: 'text-blue-500', label: 'Commented' }
};

const getRoleBadgeColor = (role) => {
  switch (role) {
    case 'admin': return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'recruiter': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'client_user': return 'bg-teal-100 text-teal-800 border-teal-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getRoleDisplayName = (role) => {
  switch (role) {
    case 'admin': return 'Admin';
    case 'recruiter': return 'Recruiter';
    case 'client_user': return 'Client';
    default: return role;
  }
};

export const ReviewPanel = ({ candidateId, currentStatus }) => {
  const { token, user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [candidateId]);

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API}/candidates/${candidateId}/reviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviews(response.data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      toast.error('Failed to load activity');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action, comment = null) => {
    setSubmitting(true);
    try {
      const response = await axios.post(
        `${API}/candidates/${candidateId}/review`,
        { action, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Add the new review to the list with animation
      setReviews(prev => [response.data, ...prev]);
      
      // Show success message
      const actionLabel = actionIcons[action].label;
      toast.success(`Candidate ${actionLabel.toLowerCase()}`, {
        description: comment ? 'Your comment has been added' : undefined
      });

      // Clear comment box if action was COMMENT
      if (action === 'COMMENT') {
        setCommentText('');
      }

      // Trigger parent component update if needed
      if (action !== 'COMMENT') {
        // Reload the page to reflect status change
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
      toast.error('Failed to submit action');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommentSubmit = () => {
    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }
    handleAction('COMMENT', commentText);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600 mt-2">Loading activity...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl p-6 border border-blue-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">Take Action</h4>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => handleAction('APPROVE')}
            disabled={submitting || currentStatus === 'APPROVED'}
            className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-md"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve for Interview
          </Button>
          <Button
            onClick={() => handleAction('PIPELINE')}
            disabled={submitting || currentStatus === 'PIPELINE'}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white shadow-md"
          >
            <Clock className="h-4 w-4 mr-2" />
            Keep in Pipeline
          </Button>
          <Button
            onClick={() => handleAction('REJECT')}
            disabled={submitting || currentStatus === 'REJECTED'}
            variant="outline"
            className="border-2 border-red-500 text-red-600 hover:bg-red-50 shadow-md"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
        </div>
      </div>

      {/* Comment Box */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Add Comment</h4>
        <div className="space-y-3">
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Share your thoughts about this candidate..."
            rows={3}
            className="resize-none"
          />
          <Button
            onClick={handleCommentSubmit}
            disabled={submitting || !commentText.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-4 w-4 mr-2" />
            Post Comment
          </Button>
        </div>
      </div>

      {/* Hybrid Timeline */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          Activity Timeline
        </h4>

        {reviews.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No activity yet</p>
            <p className="text-sm text-gray-400 mt-1">Be the first to take action on this candidate</p>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical Timeline Spine */}
            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-blue-300 via-teal-300 to-blue-300"></div>

            {/* Timeline Items */}
            <div className="space-y-6">
              {reviews.map((review, index) => {
                const ActionIcon = actionIcons[review.action].icon;
                const iconColor = actionIcons[review.action].color;
                const actionLabel = actionIcons[review.action].label;

                return (
                  <div
                    key={review.review_id}
                    className="relative flex gap-6 animate-fadeInUp"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Left Side: Icon Node */}
                    <div className="flex-shrink-0 relative z-10">
                      <div className="w-12 h-12 rounded-full bg-white border-4 border-gray-100 shadow-lg flex items-center justify-center">
                        <ActionIcon className={`h-6 w-6 ${iconColor}`} />
                      </div>
                    </div>

                    {/* Right Side: Glass Message Card */}
                    <div className="flex-1 group">
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-300">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-gray-900">{review.user_name}</span>
                            <Badge className={`${getRoleBadgeColor(review.user_role)} border text-xs`}>
                              {getRoleDisplayName(review.user_role)}
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-500">{formatTimestamp(review.timestamp)}</span>
                        </div>

                        {/* Action Label */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`font-medium text-sm ${iconColor}`}>{actionLabel}</span>
                        </div>

                        {/* Comment Text */}
                        {review.comment && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                              {review.comment}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

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
        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease-out both;
        }
      `}</style>
    </div>
  );
};
