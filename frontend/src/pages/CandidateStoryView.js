import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Download, 
  RefreshCw, 
  Briefcase, 
  MapPin, 
  Calendar,
  GraduationCap,
  Star,
  Award,
  TrendingUp
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const CandidateStoryView = () => {
  const navigate = useNavigate();
  const { candidateId } = useParams();
  const { token, user } = useAuth();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchCandidateStory();
  }, [candidateId]);

  const fetchCandidateStory = async () => {
    try {
      const response = await axios.get(`${API}/candidates/${candidateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCandidate(response.data);
    } catch (error) {
      console.error('Failed to fetch candidate:', error);
      toast.error('Failed to load candidate story');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateStory = async () => {
    setRegenerating(true);
    try {
      const response = await axios.post(
        `${API}/candidates/${candidateId}/story/regenerate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCandidate(response.data);
      toast.success('Story regenerated successfully');
    } catch (error) {
      console.error('Failed to regenerate story:', error);
      toast.error('Failed to regenerate story');
    } finally {
      setRegenerating(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const response = await axios.get(
        `${API}/candidates/${candidateId}/story/export`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `candidate_story_${candidate.name.replace(/\s+/g, '_')}_${candidateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Failed to export PDF:', error);
      toast.error('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  const canEdit = user?.role === 'admin' || user?.role === 'recruiter';
  const story = candidate?.ai_story || {};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F7F5F1' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600" style={{ fontFamily: 'Georgia, serif' }}>Loading story...</p>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F5F1' }}>
      {/* Navigation Header */}
      <nav className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center max-w-7xl">
          <Button
            onClick={() => navigate(`/candidates/${candidateId}`)}
            variant="ghost"
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Details
          </Button>
          <div className="flex items-center gap-3">
            {canEdit && (
              <Button
                onClick={handleRegenerateStory}
                disabled={regenerating}
                variant="ghost"
                className="text-white hover:bg-white/10 border border-white/20"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${regenerating ? 'animate-spin' : ''}`} />
                Regenerate
              </Button>
            )}
            <Button
              onClick={handleExportPDF}
              disabled={exporting}
              className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export as PDF'}
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto max-w-6xl p-8">
        {/* 1. Hero Banner */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 shadow-xl border-2 mb-8" style={{ borderColor: '#D4AF37' }}>
          <div className="text-center">
            <h1 
              className="text-6xl font-bold mb-3 text-gray-900"
              style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
            >
              {candidate.name}
            </h1>
            {candidate.current_role && (
              <p className="text-2xl text-gray-700 mb-4" style={{ fontFamily: 'Helvetica, sans-serif' }}>
                {candidate.current_role}
              </p>
            )}
            <div className="flex justify-center items-center gap-4 mt-6">
              <Badge 
                className="px-4 py-2 text-sm font-medium"
                style={{ backgroundColor: '#D4AF37', color: 'white' }}
              >
                Fit Score: {story.fit_score || 50}%
              </Badge>
              <Badge 
                className="px-4 py-2 text-sm font-medium bg-gray-200 text-gray-800"
              >
                Status: {candidate.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* 2. Profile Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {candidate.experience && candidate.experience.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 text-center shadow-md">
              <Briefcase className="h-8 w-8 mx-auto mb-2 text-amber-700" />
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Helvetica, sans-serif' }}>Experience</p>
              <p className="text-lg font-semibold text-gray-900">{candidate.experience.length} roles</p>
            </div>
          )}
          {candidate.education && candidate.education.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 text-center shadow-md">
              <GraduationCap className="h-8 w-8 mx-auto mb-2 text-amber-700" />
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Helvetica, sans-serif' }}>Education</p>
              <p className="text-lg font-semibold text-gray-900">{candidate.education.length} degrees</p>
            </div>
          )}
          {candidate.skills && candidate.skills.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 text-center shadow-md">
              <Star className="h-8 w-8 mx-auto mb-2 text-amber-700" />
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Helvetica, sans-serif' }}>Skills</p>
              <p className="text-lg font-semibold text-gray-900">{candidate.skills.length} skills</p>
            </div>
          )}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 text-center shadow-md">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-amber-700" />
            <p className="text-sm text-gray-600" style={{ fontFamily: 'Helvetica, sans-serif' }}>Status</p>
            <p className="text-lg font-semibold text-gray-900">{candidate.status}</p>
          </div>
        </div>

        {/* 3. AI Summary Block */}
        {story.summary && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl mb-8 border-l-4" style={{ borderColor: '#D4AF37' }}>
            <h2 
              className="text-3xl font-bold mb-4 text-gray-900"
              style={{ fontFamily: 'Georgia, serif', color: '#D4AF37' }}
            >
              Professional Summary
            </h2>
            <p 
              className="text-lg leading-relaxed text-gray-800"
              style={{ fontFamily: 'Helvetica, sans-serif', lineHeight: '1.8' }}
            >
              {story.summary}
            </p>
            {story.headline && (
              <p 
                className="text-xl font-semibold mt-4 text-amber-900 italic"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                "{story.headline}"
              </p>
            )}
          </div>
        )}

        {/* 4. Career Timeline */}
        {candidate.experience && candidate.experience.length > 0 && (
          <div className="mb-8">
            <h2 
              className="text-3xl font-bold mb-6 text-gray-900"
              style={{ fontFamily: 'Georgia, serif', color: '#D4AF37' }}
            >
              Career Timeline
            </h2>
            <div className="relative">
              <div className="absolute left-8 top-8 bottom-8 w-1 bg-gradient-to-b from-amber-600 via-amber-500 to-amber-600"></div>
              <div className="space-y-6">
                {candidate.experience.map((exp, index) => (
                  <div 
                    key={index} 
                    className="relative flex gap-6 animate-fadeInUp"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex-shrink-0 relative z-10">
                      <div className="w-16 h-16 rounded-full bg-white border-4 border-amber-600 shadow-lg flex items-center justify-center">
                        <Briefcase className="h-7 w-7 text-amber-700" />
                      </div>
                    </div>
                    <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-md hover:shadow-xl transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 
                            className="text-xl font-bold text-gray-900"
                            style={{ fontFamily: 'Georgia, serif' }}
                          >
                            {exp.role || 'Position'}
                          </h3>
                          {exp.company && (
                            <p className="text-gray-700 flex items-center gap-2 mt-1">
                              <Briefcase className="h-4 w-4" />
                              {exp.company}
                            </p>
                          )}
                        </div>
                        {exp.duration && (
                          <Badge className="bg-amber-100 text-amber-800">
                            {exp.duration}
                          </Badge>
                        )}
                      </div>
                      {exp.achievements && Array.isArray(exp.achievements) && exp.achievements.length > 0 && (
                        <ul className="space-y-2 mt-3">
                          {exp.achievements.map((achievement, i) => (
                            <li key={i} className="flex items-start gap-2 text-gray-700">
                              <span className="text-amber-600 font-bold">•</span>
                              <span>{achievement}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. Skills Visualization */}
        {candidate.skills && candidate.skills.length > 0 && (
          <div className="mb-8">
            <h2 
              className="text-3xl font-bold mb-6 text-gray-900"
              style={{ fontFamily: 'Georgia, serif', color: '#D4AF37' }}
            >
              Core Skills & Expertise
            </h2>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
              <div className="flex flex-wrap gap-3">
                {candidate.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-5 py-3 bg-gradient-to-r from-amber-50 to-amber-100 text-amber-900 rounded-full text-sm font-medium border border-amber-300 hover:from-amber-100 hover:to-amber-200 transition-all cursor-default shadow-sm"
                    style={{ fontFamily: 'Helvetica, sans-serif' }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 6. Achievements Grid */}
        {story.highlights && story.highlights.length > 0 && (
          <div className="mb-8">
            <h2 
              className="text-3xl font-bold mb-6 text-gray-900"
              style={{ fontFamily: 'Georgia, serif', color: '#D4AF37' }}
            >
              Key Achievements & Wins
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {story.highlights.map((highlight, index) => (
                <div
                  key={index}
                  className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-md hover:shadow-xl transition-all border-l-4"
                  style={{ borderColor: '#D4AF37', animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start gap-3">
                    <Award className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
                    <p className="text-gray-800 leading-relaxed" style={{ fontFamily: 'Helvetica, sans-serif' }}>
                      {highlight}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. Footer */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg text-center border-t-2" style={{ borderColor: '#D4AF37' }}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-600 text-sm" style={{ fontFamily: 'Georgia, serif' }}>
              <p className="font-semibold text-gray-900">Arbeit Talent Platform</p>
              <p className="text-xs mt-1">Professional Candidate Storyboarding Experience</p>
            </div>
            <div className="text-gray-500 text-sm" style={{ fontFamily: 'Helvetica, sans-serif' }}>
              <p>Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p className="text-xs mt-1">Candidate ID: {candidateId}</p>
            </div>
          </div>
        </div>
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
          animation: fadeInUp 0.6s ease-out both;
        }
      `}</style>
    </div>
  );
};
