import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { Edit, Save, X, Mail, Phone, Briefcase, GraduationCap } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const CandidateResumeSection = ({ candidate, canEdit, onUpdate }) => {
  const { token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: candidate.name || '',
    current_role: candidate.current_role || '',
    email: candidate.email || '',
    phone: candidate.phone || '',
    summary: candidate.summary || '',
    skills: candidate.skills || []
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(
        `${API}/candidates/${candidate.candidate_id}`,
        editData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Candidate updated successfully');
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to update candidate:', error);
      toast.error('Failed to update candidate');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      name: candidate.name || '',
      current_role: candidate.current_role || '',
      email: candidate.email || '',
      phone: candidate.phone || '',
      summary: candidate.summary || '',
      skills: candidate.skills || []
    });
    setIsEditing(false);
  };

  const handleSkillsChange = (skillsText) => {
    const skillsArray = skillsText.split(',').map(s => s.trim()).filter(Boolean);
    setEditData({ ...editData, skills: skillsArray });
  };

  if (isEditing && canEdit) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end gap-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            onClick={handleCancel}
            variant="outline"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Full Name</Label>
            <Input
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            />
          </div>
          <div>
            <Label>Current Role</Label>
            <Input
              value={editData.current_role}
              onChange={(e) => setEditData({ ...editData, current_role: e.target.value })}
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={editData.email}
              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              value={editData.phone}
              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label>Skills (comma-separated)</Label>
          <Input
            value={editData.skills.join(', ')}
            onChange={(e) => handleSkillsChange(e.target.value)}
            placeholder="React, Node.js, Python"
          />
        </div>

        <div>
          <Label>Professional Summary</Label>
          <Textarea
            value={editData.summary}
            onChange={(e) => setEditData({ ...editData, summary: e.target.value })}
            rows={4}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {canEdit && (
        <div className="flex justify-end">
          <Button
            onClick={() => setIsEditing(true)}
            variant="outline"
            className="border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Resume Data
          </Button>
        </div>
      )}

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Briefcase className="h-5 w-5" />
            <span className="text-sm font-medium">Current Role</span>
          </div>
          <p className="text-lg font-semibold text-blue-900">
            {candidate.current_role || 'Not specified'}
          </p>
        </div>

        {candidate.email && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Mail className="h-5 w-5" />
              <span className="text-sm font-medium">Email</span>
            </div>
            <p className="text-lg font-semibold text-blue-900">{candidate.email}</p>
          </div>
        )}

        {candidate.phone && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Phone className="h-5 w-5" />
              <span className="text-sm font-medium">Phone</span>
            </div>
            <p className="text-lg font-semibold text-blue-900">{candidate.phone}</p>
          </div>
        )}
      </div>

      {/* Skills */}
      {candidate.skills && candidate.skills.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Skills</h4>
          <div className="flex flex-wrap gap-2">
            {candidate.skills.map((skill, index) => (
              <Badge key={index} className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {candidate.summary && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Professional Summary</h4>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-700 whitespace-pre-line">{candidate.summary}</p>
          </div>
        </div>
      )}

      {/* Experience */}
      {candidate.experience && candidate.experience.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-blue-600" />
            Experience
          </h4>
          <div className="space-y-4">
            {candidate.experience.map((exp, index) => (
              <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg">
                {exp.role && <p className="font-semibold text-gray-900">{exp.role}</p>}
                {exp.company && <p className="text-sm text-gray-600">{exp.company}</p>}
                {exp.duration && <p className="text-xs text-gray-500 mt-1">{exp.duration}</p>}
                {exp.achievements && Array.isArray(exp.achievements) && exp.achievements.length > 0 && (
                  <ul className="list-disc list-inside text-sm text-gray-700 mt-2">
                    {exp.achievements.map((achievement, i) => (
                      <li key={i}>{achievement}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {candidate.education && candidate.education.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            Education
          </h4>
          <div className="space-y-4">
            {candidate.education.map((edu, index) => (
              <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg">
                {edu.degree && <p className="font-semibold text-gray-900">{edu.degree}</p>}
                {edu.institution && <p className="text-sm text-gray-600">{edu.institution}</p>}
                {edu.year && <p className="text-xs text-gray-500 mt-1">{edu.year}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};