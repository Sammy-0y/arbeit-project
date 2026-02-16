import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { Eye, EyeOff, FileText } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const CandidateCVViewer = ({ candidateId, canViewFull, cvFileUrl }) => {
  const { token } = useAuth();
  const [cvData, setCvData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState(canViewFull ? 'full' : 'redacted');

  useEffect(() => {
    if (!cvFileUrl) {
      fetchCV();
    } else {
      setLoading(false);
    }
  }, [candidateId, viewMode, cvFileUrl]);

  const fetchCV = async () => {
    try {
      const redacted = viewMode === 'redacted';
      const response = await axios.get(
        `${API}/candidates/${candidateId}/cv?redacted=${redacted}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCvData(response.data);
    } catch (error) {
      console.error('Failed to fetch CV:', error);
      toast.error('Failed to load CV');
    } finally {
      setLoading(false);
    }
  };

  const toggleView = () => {
    setViewMode(prev => prev === 'full' ? 'redacted' : 'full');
    setLoading(true);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600 mt-2">Loading CV...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Toggle (only for recruiters/admins) */}
      {canViewFull && (
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            {viewMode === 'full' ? (
              <Eye className="h-5 w-5 text-blue-600" />
            ) : (
              <EyeOff className="h-5 w-5 text-gray-600" />
            )}
            <span className="font-medium text-gray-900">
              Viewing: {viewMode === 'full' ? 'Full CV' : 'Redacted CV'}
            </span>
          </div>
          <Button
            onClick={toggleView}
            variant="outline"
            size="sm"
            className="border-blue-500 text-blue-600 hover:bg-blue-100"
          >
            Switch to {viewMode === 'full' ? 'Redacted' : 'Full'} View
          </Button>
        </div>
      )}

      {/* CV Content */}
      {cvFileUrl ? (
        <div className="relative">
          {viewMode === 'redacted' && (
            <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
              <div className="flex items-start gap-2">
                <EyeOff className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-900">Redacted View</p>
                  <p className="text-sm text-yellow-800">
                    Contact information is masked in the preview.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white border-2 border-gray-200 rounded-lg shadow-inner overflow-hidden">
            <div className="flex items-center gap-2 p-4 border-b border-gray-200 bg-gray-50">
              <FileText className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold text-gray-900">CV Document</h4>
            </div>
            {/* Render CV file in iframe */}
            <div className="relative" style={{ height: '600px' }}>
              <iframe
                src={`${BACKEND_URL}${cvFileUrl}`}
                className="w-full h-full"
                title="CV Document"
                style={{ border: 'none' }}
              />
            </div>
          </div>
        </div>
      ) : cvData?.cv_text ? (
        <div className="relative">
          {cvData.is_redacted && (
            <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
              <div className="flex items-start gap-2">
                <EyeOff className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-900">Redacted View</p>
                  <p className="text-sm text-yellow-800">
                    Personal contact information has been redacted for privacy.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="p-6 bg-white border-2 border-gray-200 rounded-lg shadow-inner">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
              <FileText className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold text-gray-900">CV Content</h4>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed max-h-[500px] overflow-y-auto">
              {cvData.cv_text}
            </pre>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No CV text available</p>
          <p className="text-sm">This candidate was added manually without a CV upload</p>
        </div>
      )}
    </div>
  );
};