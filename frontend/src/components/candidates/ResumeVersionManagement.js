import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Upload,
  Download,
  Eye,
  FileText,
  Clock,
  User,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const ResumeVersionManagement = ({ candidateId, token, userRole, onVersionChange }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchVersions();
  }, [candidateId]);

  const fetchVersions = async () => {
    try {
      const response = await axios.get(
        `${API}/candidates/${candidateId}/cv/versions`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { include_deleted: userRole === 'admin' }
        }
      );
      setVersions(response.data);
    } catch (error) {
      console.error('Failed to fetch versions:', error);
      toast.error('Failed to load resume versions');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleReplaceResume = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    setUploadProgress('Step 1: Uploading file...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      setTimeout(() => setUploadProgress('Step 2: Parsing with AI...'), 1000);

      const response = await axios.post(
        `${API}/candidates/${candidateId}/cv`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setUploadProgress('Step 3: Updating active version & regenerating story...');

      setTimeout(() => {
        toast.success('Resume replaced and AI data refreshed');
        setShowUploadModal(false);
        setSelectedFile(null);
        setUploadProgress('');
        fetchVersions();
        if (onVersionChange) onVersionChange();
      }, 1000);
    } catch (error) {
      console.error('Failed to replace resume:', error);
      const message = error.response?.data?.detail || 'Failed to replace resume';
      toast.error(message);
      setUploadProgress('');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteVersion = async (versionId, mode = 'soft') => {
    if (!window.confirm(`Are you sure you want to ${mode} delete this version?`)) {
      return;
    }

    try {
      await axios.delete(
        `${API}/candidates/${candidateId}/cv/versions/${versionId}?mode=${mode}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success(`Version ${mode} deleted successfully`);
      fetchVersions();
    } catch (error) {
      console.error('Failed to delete version:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete version');
    }
  };

  const handleViewVersion = (version) => {
    const url = `${BACKEND_URL}${version.file_url}`;
    window.open(url, '_blank');
  };

  const handleDownloadVersion = async (version) => {
    try {
      const response = await axios.get(`${BACKEND_URL}${version.file_url}`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = version.source_filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Download started');
    } catch (error) {
      console.error('Failed to download:', error);
      toast.error('Failed to download file');
    }
  };

  const activeVersion = versions.find(v => v.is_active);
  const historicalVersions = versions.filter(v => !v.is_active && !v.deleted_at);
  const deletedVersions = versions.filter(v => v.deleted_at);

  const canReplace = userRole === 'admin' || userRole === 'recruiter'; // Simplified - should check permissions

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <h2 
        className="text-3xl font-bold text-gray-900"
        style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.01em' }}
      >
        Resume & AI Data Versions
      </h2>

      {/* Current Resume Card */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-xl border-2" style={{ borderColor: '#D4AF37' }}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="h-6 w-6 text-amber-700" />
              <h3 
                className="text-xl font-semibold text-gray-900"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Current Resume
              </h3>
              {activeVersion && (
                <Badge 
                  className="px-3 py-1 text-sm font-medium"
                  style={{ backgroundColor: '#D4AF37', color: 'white' }}
                >
                  Version {activeVersion.version_number}
                </Badge>
              )}
            </div>

            {activeVersion && (
              <div className="space-y-2 text-sm text-gray-600" style={{ fontFamily: 'Helvetica, sans-serif' }}>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Uploaded: {new Date(activeVersion.uploaded_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>By: {activeVersion.uploaded_by_email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>{activeVersion.source_filename}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {activeVersion && (
              <>
                <Button
                  onClick={() => handleViewVersion(activeVersion)}
                  variant="outline"
                  className="border-amber-600 text-amber-700 hover:bg-amber-50"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View CV
                </Button>
                <Button
                  onClick={() => handleDownloadVersion(activeVersion)}
                  variant="outline"
                  className="border-amber-600 text-amber-700 hover:bg-amber-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </>
            )}
            {canReplace && (
              <Button
                onClick={() => setShowUploadModal(true)}
                className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Replace Resume
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t-2 border-amber-200"></div>

      {/* Resume History */}
      <div>
        <h3 
          className="text-2xl font-semibold text-gray-900 mb-4"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          Resume History
        </h3>

        {historicalVersions.length === 0 && (
          <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6 text-center">
            <p className="text-gray-600" style={{ fontFamily: 'Helvetica, sans-serif' }}>
              No previous versions available
            </p>
          </div>
        )}

        {/* Timeline */}
        <div className="space-y-4">
          {historicalVersions.map((version, index) => (
            <div key={version.version_id} className="relative">
              {/* Timeline connector */}
              {index < historicalVersions.length - 1 && (
                <div 
                  className="absolute left-4 top-12 bottom-0 w-0.5 bg-amber-200"
                  style={{ height: 'calc(100% + 1rem)' }}
                ></div>
              )}

              {/* Version Card */}
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 shadow-md border border-amber-100 ml-10 relative">
                {/* Timeline dot */}
                <div 
                  className="absolute -left-6 top-6 w-3 h-3 rounded-full border-2"
                  style={{ backgroundColor: '#F7F5F1', borderColor: '#D4AF37' }}
                ></div>

                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge 
                        variant="outline"
                        className="text-xs"
                        style={{ borderColor: '#D4AF37', color: '#D4AF37' }}
                      >
                        v{version.version_number}
                      </Badge>
                      <span className="text-sm text-gray-600" style={{ fontFamily: 'Helvetica, sans-serif' }}>
                        {new Date(version.uploaded_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-1" style={{ fontFamily: 'Helvetica, sans-serif' }}>
                      {version.source_filename}
                    </p>
                    <p className="text-xs text-gray-500">
                      Uploaded by: {version.uploaded_by_email}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleViewVersion(version)}
                      size="sm"
                      variant="ghost"
                      className="text-amber-700 hover:bg-amber-50"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      onClick={() => handleDownloadVersion(version)}
                      size="sm"
                      variant="ghost"
                      className="text-amber-700 hover:bg-amber-50"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    {userRole === 'admin' && (
                      <Button
                        onClick={() => handleDeleteVersion(version.version_id, 'soft')}
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Deleted Versions (Admin only) */}
        {userRole === 'admin' && deletedVersions.length > 0 && (
          <details className="mt-6">
            <summary 
              className="cursor-pointer text-gray-600 text-sm font-medium mb-4"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Archived (Soft Deleted) - {deletedVersions.length} versions
            </summary>
            <div className="space-y-2 ml-4">
              {deletedVersions.map(version => (
                <div key={version.version_id} className="bg-gray-100/50 rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">v{version.version_number}</span>
                      <span className="text-gray-600 ml-2">{version.source_filename}</span>
                      <Badge variant="destructive" className="ml-2 text-xs">
                        {version.delete_type}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                      Deleted: {new Date(version.deleted_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" style={{ backgroundColor: '#F7F5F1' }}>
            <h3 
              className="text-2xl font-bold text-gray-900 mb-4"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Replace Resume
            </h3>

            {!uploading ? (
              <>
                <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: 'Helvetica, sans-serif' }}>
                  Upload a new PDF resume. This will:
                </p>
                <ul className="text-sm text-gray-600 mb-6 space-y-1 ml-4" style={{ fontFamily: 'Helvetica, sans-serif' }}>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    Parse the resume with AI
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    Regenerate the candidate story
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    Update fit score and parsed data
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    Mark the current version as inactive
                  </li>
                </ul>

                <div className="border-2 border-dashed border-amber-300 rounded-xl p-6 mb-4 text-center">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label
                    htmlFor="resume-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="h-12 w-12 text-amber-600 mb-2" />
                    <span className="text-sm text-gray-700" style={{ fontFamily: 'Helvetica, sans-serif' }}>
                      {selectedFile ? selectedFile.name : 'Click to select PDF file'}
                    </span>
                  </label>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setShowUploadModal(false);
                      setSelectedFile(null);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReplaceResume}
                    disabled={!selectedFile}
                    className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white"
                  >
                    Upload & Replace
                  </Button>
                </div>
              </>
            ) : (
              <div className="py-8">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-12 w-12 animate-spin text-amber-600" />
                  <p className="text-center text-gray-700" style={{ fontFamily: 'Helvetica, sans-serif' }}>
                    {uploadProgress}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
