import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Users
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STAT_CONFIGS = [
  { key: 'awaiting_confirmation', label: 'Awaiting', icon: Clock, color: 'text-amber-600 bg-amber-50' },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle, color: 'text-blue-600 bg-blue-50' },
  { key: 'scheduled', label: 'Scheduled', icon: Calendar, color: 'text-green-600 bg-green-50' },
  { key: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-teal-600 bg-teal-50' },
  { key: 'no_shows', label: 'No Shows', icon: XCircle, color: 'text-red-600 bg-red-50' },
  { key: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'text-gray-600 bg-gray-50' }
];

export const InterviewPipelineStats = ({ token, clientId = null }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [clientId]);

  const fetchStats = async () => {
    try {
      const params = clientId ? { client_id: clientId } : {};
      const response = await axios.get(`${API}/interviews/stats/pipeline`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch interview stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <Card data-testid="interview-pipeline-stats">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" />
          Interview Pipeline
          <span className="ml-auto text-2xl font-bold text-blue-600">
            {stats.total_interviews}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {STAT_CONFIGS.map(({ key, label, icon: Icon, color }) => (
            <div 
              key={key}
              className={`p-3 rounded-lg text-center ${color}`}
              data-testid={`stat-${key}`}
            >
              <Icon className="h-5 w-5 mx-auto mb-1" />
              <div className="text-xl font-bold">{stats[key] || 0}</div>
              <div className="text-xs">{label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
