import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { Upload, FileText, X, Plus, Check } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AddCandidateModal = ({ open, onClose, onSuccess, jobId, job }) => {
  const { token } = useAuth();
  const [mode, setMode] = useState('upload'); // 'upload' or 'manual'
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsedData, setParsedData] = useState(null);
  const [step, setStep] = useState(1); // 1: upload/entry, 2: review

  // Upload mode state
  const [selectedFile, setSelectedFile] = useState(null);

  // Manual mode state
  const [manualData, setManualData] = useState({
    name: '',
    current_role: '',
    email: '',
    phone: '',
    summary: '',
    skills: '',
    experience: '',
    education: ''
  });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size should be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a CV file');
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('job_id', jobId);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 300);

      const response = await axios.post(`${API}/candidates/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      setParsedData(response.data);
      setStep(2);
      toast.success('CV parsed successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to upload CV');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualData.name.trim()) {
      toast.error('Candidate name is required');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        job_id: jobId,
        name: manualData.name,
        current_role: manualData.current_role || null,
        email: manualData.email || null,
        phone: manualData.phone || null,
        summary: manualData.summary || null,
        skills: manualData.skills ? manualData.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        experience: manualData.experience ? parseExperience(manualData.experience) : [],
        education: manualData.education ? parseEducation(manualData.education) : []
      };

      const response = await axios.post(`${API}/candidates`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setParsedData(response.data);
      setStep(2);
      toast.success('Candidate created successfully!');
    } catch (error) {
      console.error('Creation failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to create candidate');
    } finally {
      setLoading(false);
    }
  };

  const parseExperience = (text) => {
    const lines = text.split('\n').filter(l => l.trim());
    return lines.map(line => ({
      role: line,
      company: '',
      duration: ''
    }));
  };

  const parseEducation = (text) => {
    const lines = text.split('\n').filter(l => l.trim());
    return lines.map(line => ({
      degree: line,
      institution: '',
      year: ''
    }));
  };

  const handleEditField = (field, value) => {
    setParsedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConfirm = () => {
    onSuccess();
    handleReset();
  };

  const handleReset = () => {
    setMode('upload');
    setSelectedFile(null);
    setManualData({
      name: '',
      current_role: '',
      email: '',
      phone: '',
      summary: '',
      skills: '',
      experience: '',
      education: ''
    });
    setParsedData(null);
    setStep(1);
    setUploadProgress(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleReset}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-blue-900 flex items-center gap-2">
            <Plus className="h-6 w-6" />
            Add New Candidate
          </DialogTitle>
          <p className="text-sm text-gray-600">
            For: <span className="font-semibold">{job?.title}</span>
          </p>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6">
            {/* Mode Selector */}
            <div className="flex gap-4 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setMode('upload')}
                className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
                  mode === 'upload'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Upload className="inline h-4 w-4 mr-2" />
                Upload CV
              </button>
              <button
                onClick={() => setMode('manual')}
                className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
                  mode === 'manual'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText className="inline h-4 w-4 mr-2" />
                Manual Entry
              </button>
            </div>

            {/* Upload Mode */}
            {mode === 'upload' && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    id="cv-upload"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label htmlFor="cv-upload" className="cursor-pointer">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      {selectedFile ? selectedFile.name : 'Click to upload CV'}
                    </p>
                    <p className="text-sm text-gray-500">PDF, DOC, DOCX (Max 10MB)</p>
                  </label>
                </div>

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="space-y-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-teal-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 text-center">Parsing CV... {uploadProgress}%</p>
                  </div>
                )}

                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
                >
                  {loading ? 'Processing...' : 'Upload & Parse CV'}
                </Button>
              </div>
            )}

            {/* Manual Mode */}
            {mode === 'manual' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={manualData.name}
                      onChange={(e) => setManualData({ ...manualData, name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="current_role">Current Role</Label>
                    <Input
                      id="current_role"
                      value={manualData.current_role}
                      onChange={(e) => setManualData({ ...manualData, current_role: e.target.value })}
                      placeholder="Senior Software Engineer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={manualData.email}
                      onChange={(e) => setManualData({ ...manualData, email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={manualData.phone}
                      onChange={(e) => setManualData({ ...manualData, phone: e.target.value })}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="skills">Skills (comma-separated)</Label>
                  <Input
                    id="skills"
                    value={manualData.skills}
                    onChange={(e) => setManualData({ ...manualData, skills: e.target.value })}
                    placeholder="React, Node.js, Python, AWS"
                  />
                </div>

                <div>
                  <Label htmlFor="summary">Professional Summary</Label>
                  <Textarea
                    id="summary"
                    value={manualData.summary}
                    onChange={(e) => setManualData({ ...manualData, summary: e.target.value })}
                    placeholder="Brief professional summary..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="experience">Experience (one per line)</Label>
                  <Textarea
                    id="experience"
                    value={manualData.experience}
                    onChange={(e) => setManualData({ ...manualData, experience: e.target.value })}
                    placeholder="Senior Developer at TechCorp\nJunior Developer at StartupInc"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="education">Education (one per line)</Label>
                  <Textarea
                    id="education"
                    value={manualData.education}
                    onChange={(e) => setManualData({ ...manualData, education: e.target.value })}
                    placeholder="BS Computer Science, MIT\nMS Data Science, Stanford"
                    rows={2}
                  />
                </div>

                <Button
                  onClick={handleManualSubmit}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
                >
                  {loading ? 'Creating...' : 'Create Candidate'}
                </Button>
              </div>
            )}
          </div>
        )}

        {step === 2 && parsedData && (
          <div className="space-y-6">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4 flex items-center gap-3">
                <Check className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Candidate Added Successfully!</p>
                  <p className="text-sm text-green-700">Review the details and close this dialog.</p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div>
                <Label className="text-gray-700 font-semibold">Name</Label>
                <p className="text-lg text-blue-900">{parsedData.name}</p>
              </div>

              {parsedData.current_role && (
                <div>
                  <Label className="text-gray-700 font-semibold">Current Role</Label>
                  <p className="text-gray-800">{parsedData.current_role}</p>
                </div>
              )}

              {parsedData.skills && parsedData.skills.length > 0 && (
                <div>
                  <Label className="text-gray-700 font-semibold">Skills</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {parsedData.skills.map((skill, idx) => (
                      <Badge key={idx} className="bg-blue-100 text-blue-800">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {parsedData.summary && (
                <div>
                  <Label className="text-gray-700 font-semibold">Summary</Label>
                  <p className="text-gray-700 text-sm">{parsedData.summary}</p>
                </div>
              )}

              {parsedData.ai_story && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg border border-blue-200">
                  <Label className="text-blue-900 font-semibold flex items-center gap-2">
                    <span className="text-xl">✨</span> AI Story Generated
                  </Label>
                  <p className="text-sm text-gray-700 mt-2">{parsedData.ai_story.headline}</p>
                  <p className="text-xs text-teal-700 mt-1">Fit Score: {parsedData.ai_story.fit_score}%</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button onClick={handleConfirm} className="flex-1 bg-teal-600 hover:bg-teal-700">
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};