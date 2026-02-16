import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Notice period options in days
const NOTICE_PERIOD_OPTIONS = [
  { value: 0, label: 'Immediate' },
  { value: 7, label: '1 Week' },
  { value: 15, label: '15 Days' },
  { value: 30, label: '1 Month' },
  { value: 45, label: '45 Days' },
  { value: 60, label: '2 Months' },
  { value: 90, label: '3 Months' }
];

export const JobForm = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const { token, logout, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    employment_type: 'Full-time',
    experience_range: { min_years: 0, max_years: 0 },
    salary_range: { min_amount: '', max_amount: '', currency: 'INR' },
    work_model: 'Onsite',
    city: '',
    notice_period_days: '',
    required_skills: '',
    description: '',
    status: 'Active',
    client_id: ''
  });

  const isEditMode = Boolean(jobId);
  const isAdminOrRecruiter = ['admin', 'recruiter'].includes(user?.role);
  const requiresCity = ['Onsite', 'Hybrid'].includes(formData.work_model);

  useEffect(() => {
    if (isAdminOrRecruiter) {
      fetchClients();
    }
    if (isEditMode) {
      fetchJobDetails();
    }
  }, [jobId]);

  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API}/clients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClients(response.data);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  };

  const fetchJobDetails = async () => {
    try {
      const response = await axios.get(`${API}/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const job = response.data;
      setFormData({
        title: job.title,
        location: job.location,
        employment_type: job.employment_type,
        experience_range: job.experience_range,
        salary_range: job.salary_range || { min_amount: '', max_amount: '', currency: 'INR' },
        work_model: job.work_model,
        city: job.city || '',
        notice_period_days: job.notice_period_days ?? '',
        required_skills: job.required_skills.join(', '),
        description: job.description,
        status: job.status,
        client_id: job.client_id
      });
    } catch (error) {
      console.error('Failed to fetch job:', error);
      toast.error('Failed to load job details');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Experience range validation
    if (formData.experience_range.max_years < formData.experience_range.min_years) {
      newErrors.experience_range = 'Maximum experience must be greater than or equal to minimum';
    }
    
    // Salary range validation (if provided)
    if (formData.salary_range.min_amount && formData.salary_range.max_amount) {
      if (parseInt(formData.salary_range.max_amount) < parseInt(formData.salary_range.min_amount)) {
        newErrors.salary_range = 'Maximum salary must be greater than or equal to minimum';
      }
    }
    
    // City validation for Onsite/Hybrid
    if (requiresCity && !formData.city.trim()) {
      newErrors.city = 'City is required for Onsite and Hybrid work models';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }
    
    setLoading(true);

    try {
      const payload = {
        ...formData,
        required_skills: formData.required_skills.split(',').map(s => s.trim()).filter(s => s),
        salary_range: formData.salary_range.min_amount || formData.salary_range.max_amount 
          ? {
              min_amount: formData.salary_range.min_amount ? parseInt(formData.salary_range.min_amount) : null,
              max_amount: formData.salary_range.max_amount ? parseInt(formData.salary_range.max_amount) : null,
              currency: formData.salary_range.currency
            }
          : null,
        city: requiresCity ? formData.city : null,
        notice_period_days: formData.notice_period_days !== '' ? parseInt(formData.notice_period_days) : null
      };

      if (isEditMode) {
        await axios.put(`${API}/jobs/${jobId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Job updated successfully');
        navigate(`/jobs/${jobId}`);
      } else {
        const response = await axios.post(`${API}/jobs`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Job created successfully');
        navigate(`/jobs/${response.data.job_id}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || `Failed to ${isEditMode ? 'update' : 'create'} job`);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const updateNestedField = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value }
    }));
    // Clear error when field is updated
    if (errors[parent]) {
      setErrors(prev => ({ ...prev, [parent]: null }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50" data-testid="job-form-page">
      <nav className="bg-blue-900 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <Button
            onClick={() => navigate(isEditMode ? `/jobs/${jobId}` : '/jobs')}
            variant="ghost"
            className="text-white hover:bg-blue-800"
            data-testid="back-button"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </nav>

      <div className="container mx-auto p-8 max-w-4xl">
        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
            <CardTitle className="text-3xl" data-testid="form-title">
              {isEditMode ? 'Edit Job Requirement' : 'Create Job Requirement'}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6" data-testid="job-form">
              {/* Client Selection (Admin/Recruiter only) */}
              {isAdminOrRecruiter && !isEditMode && (
                <div>
                  <Label>Client Company *</Label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => updateField('client_id', e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                    data-testid="client-select"
                  >
                    <option value="">Select a client</option>
                    {clients.map(client => (
                      <option key={client.client_id} value={client.client_id}>
                        {client.company_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Job Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder="e.g., Senior Software Engineer"
                    required
                    data-testid="job-title-input"
                  />
                </div>
                
                <div>
                  <Label>Location *</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => updateField('location', e.target.value)}
                    placeholder="e.g., India, USA, Remote"
                    required
                    data-testid="location-input"
                  />
                </div>
              </div>

              {/* Employment Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Employment Type *</Label>
                  <select
                    value={formData.employment_type}
                    onChange={(e) => updateField('employment_type', e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                    data-testid="employment-type-select"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
                
                <div>
                  <Label>Work Model *</Label>
                  <select
                    value={formData.work_model}
                    onChange={(e) => updateField('work_model', e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                    data-testid="work-model-select"
                  >
                    <option value="Onsite">Onsite</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
                
                <div>
                  <Label>Status *</Label>
                  <select
                    value={formData.status}
                    onChange={(e) => updateField('status', e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                    data-testid="status-select"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Active">Active</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* City (conditional - required for Onsite/Hybrid) */}
              {requiresCity && (
                <div>
                  <Label className="flex items-center gap-1">
                    City *
                    <span className="text-xs text-amber-600 ml-2">(Required for {formData.work_model})</span>
                  </Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder="e.g., Mumbai, Bangalore, Delhi NCR"
                    required={requiresCity}
                    className={errors.city ? 'border-red-500' : ''}
                    data-testid="city-input"
                  />
                  {errors.city && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1" data-testid="city-error">
                      <AlertCircle className="h-4 w-4" />
                      {errors.city}
                    </p>
                  )}
                </div>
              )}

              {/* Notice Period */}
              <div>
                <Label>Notice Period Preference</Label>
                <select
                  value={formData.notice_period_days}
                  onChange={(e) => updateField('notice_period_days', e.target.value)}
                  className="w-full p-2 border rounded"
                  data-testid="notice-period-select"
                >
                  <option value="">No preference</option>
                  {NOTICE_PERIOD_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Maximum notice period acceptable for this role</p>
              </div>

              {/* Experience Range */}
              <div>
                <Label>Experience Range (years) *</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      value={formData.experience_range.min_years}
                      onChange={(e) => updateNestedField('experience_range', 'min_years', parseInt(e.target.value) || 0)}
                      placeholder="Min years"
                      required
                      className={errors.experience_range ? 'border-red-500' : ''}
                      data-testid="min-experience-input"
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum</p>
                  </div>
                  <div>
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      value={formData.experience_range.max_years}
                      onChange={(e) => updateNestedField('experience_range', 'max_years', parseInt(e.target.value) || 0)}
                      placeholder="Max years"
                      required
                      className={errors.experience_range ? 'border-red-500' : ''}
                      data-testid="max-experience-input"
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum</p>
                  </div>
                </div>
                {errors.experience_range && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1" data-testid="experience-error">
                    <AlertCircle className="h-4 w-4" />
                    {errors.experience_range}
                  </p>
                )}
              </div>

              {/* Salary/CTC Range */}
              <div>
                <Label>CTC Range (optional)</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Input
                      type="number"
                      min="0"
                      value={formData.salary_range.min_amount}
                      onChange={(e) => updateNestedField('salary_range', 'min_amount', e.target.value)}
                      placeholder="Min CTC"
                      className={errors.salary_range ? 'border-red-500' : ''}
                      data-testid="min-salary-input"
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum</p>
                  </div>
                  <div>
                    <Input
                      type="number"
                      min="0"
                      value={formData.salary_range.max_amount}
                      onChange={(e) => updateNestedField('salary_range', 'max_amount', e.target.value)}
                      placeholder="Max CTC"
                      className={errors.salary_range ? 'border-red-500' : ''}
                      data-testid="max-salary-input"
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum</p>
                  </div>
                  <div>
                    <select
                      value={formData.salary_range.currency}
                      onChange={(e) => updateNestedField('salary_range', 'currency', e.target.value)}
                      className="w-full p-2 border rounded"
                      data-testid="currency-select"
                    >
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Currency</p>
                  </div>
                </div>
                {errors.salary_range && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1" data-testid="salary-error">
                    <AlertCircle className="h-4 w-4" />
                    {errors.salary_range}
                  </p>
                )}
              </div>

              {/* Required Skills */}
              <div>
                <Label>Required Skills (comma-separated) *</Label>
                <Input
                  value={formData.required_skills}
                  onChange={(e) => updateField('required_skills', e.target.value)}
                  placeholder="e.g., Python, React, Node.js, AWS"
                  required
                  data-testid="skills-input"
                />
                <p className="text-xs text-gray-500 mt-1">Separate skills with commas</p>
              </div>

              {/* Description */}
              <div>
                <Label>Job Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Provide a detailed job description..."
                  rows={8}
                  required
                  data-testid="description-textarea"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="bg-blue-900 hover:bg-blue-800"
                  disabled={loading}
                  data-testid="submit-button"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : (isEditMode ? 'Update Job' : 'Create Job')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(isEditMode ? `/jobs/${jobId}` : '/jobs')}
                  data-testid="cancel-button"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
