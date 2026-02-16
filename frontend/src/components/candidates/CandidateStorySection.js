import React from 'react';
import { Badge } from '../ui/badge';
import { Briefcase, Calendar, Star, Target } from 'lucide-react';

export const CandidateStorySection = ({ story }) => {
  if (!story) return null;

  return (
    <div className="space-y-6">
      {/* Headline */}
      <div className="p-6 bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg border-l-4 border-blue-500">
        <h3 className="text-2xl font-bold text-blue-900 mb-2">{story.headline}</h3>
        <p className="text-gray-700 text-lg">{story.summary}</p>
      </div>

      {/* Fit Score */}
      <div className="flex items-center gap-4 p-4 bg-teal-50 rounded-lg border border-teal-200">
        <Target className="h-8 w-8 text-teal-600" />
        <div className="flex-1">
          <p className="text-sm text-gray-600">Job Fit Score</p>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-blue-500 transition-all duration-500 rounded-full"
                style={{ width: `${story.fit_score}%` }}
              ></div>
            </div>
            <span className="text-2xl font-bold text-teal-700">{story.fit_score}%</span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      {story.timeline && story.timeline.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Career Timeline
          </h4>
          <div className="relative pl-8 space-y-6">
            <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gradient-to-b from-blue-500 to-teal-500"></div>
            {story.timeline.map((item, index) => (
              <div key={index} className="relative">
                <div className="absolute -left-5 w-3 h-3 rounded-full bg-blue-500 border-4 border-white"></div>
                <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{item.title}</p>
                      {item.company && (
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <Briefcase className="h-4 w-4" />
                          {item.company}
                        </p>
                      )}
                    </div>
                    {item.year && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {item.year}
                      </Badge>
                    )}
                  </div>
                  {item.achievement && (
                    <p className="text-sm text-gray-700 mt-2">{item.achievement}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills Cloud */}
      {story.skills && story.skills.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Skills</h4>
          <div className="flex flex-wrap gap-2">
            {story.skills.map((skill, index) => (
              <Badge
                key={index}
                className="bg-gradient-to-r from-blue-500 to-teal-500 text-white px-4 py-2 text-sm hover:from-blue-600 hover:to-teal-600 transition-all cursor-default"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Highlights */}
      {story.highlights && story.highlights.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Impact Highlights
          </h4>
          <div className="space-y-3">
            {story.highlights.map((highlight, index) => (
              <div
                key={index}
                className="flex gap-3 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500 hover:bg-yellow-100 transition-colors"
              >
                <span className="text-yellow-600 font-bold text-lg">•</span>
                <p className="text-gray-800 flex-1">{highlight}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};