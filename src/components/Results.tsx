'use client';

import { useState } from 'react';
import { FinalScore, ParsedResume } from '@/types/interview';
import ScoreDisplay from './ScoreDisplay';

interface ResultsProps {
  score: FinalScore;
  resumeData: ParsedResume;
  onStartNewInterview: () => void;
  className?: string;
}

export default function Results({ 
  score, 
  resumeData, 
  onStartNewInterview, 
  className = '' 
}: ResultsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed'>('overview');
  const [showResumeAdvice, setShowResumeAdvice] = useState(false);

  const getPerformanceLevel = (score: number) => {
    if (score >= 80) return { level: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (score >= 70) return { level: 'Strong', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (score >= 60) return { level: 'Good', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    if (score >= 50) return { level: 'Satisfactory', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    return { level: 'Needs Improvement', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const performance = getPerformanceLevel(score.overallScore);

  return (
    <div className={`max-w-4xl mx-auto p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">
          Interview Complete! 🎉
        </h1>
        <p className="text-lg text-gray-600">
          Here's your comprehensive interview analysis, {resumeData.personalInfo.name}
        </p>
      </div>

      {/* Performance Badge */}
      <div className="text-center">
        <div className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-semibold ${performance.bgColor} ${performance.color}`}>
          <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {performance.level} Performance
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-center">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Score Overview
          </button>
          <button
            onClick={() => setActiveTab('detailed')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'detailed'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Detailed Feedback
          </button>
        </div>
      </div>

      {/* Content Sections */}
      {activeTab === 'overview' && (
        <ScoreDisplay score={score} />
      )}

      {activeTab === 'detailed' && (
        <div className="space-y-6">
          {/* Detailed Feedback */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">
              Comprehensive Assessment
            </h3>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed text-lg">
                {score.detailedFeedback}
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {score.breakdown.communication}/25
              </div>
              <div className="text-sm text-blue-700 font-medium">Communication</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {score.breakdown.content}/30
              </div>
              <div className="text-sm text-green-700 font-medium">Content Quality</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {score.breakdown.experience}/25
              </div>
              <div className="text-sm text-purple-700 font-medium">Experience</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {score.breakdown.performance}/20
              </div>
              <div className="text-sm text-orange-700 font-medium">Performance</div>
            </div>
          </div>

          {/* Action Items */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
            <h4 className="text-lg font-semibold mb-3 text-gray-900">
              Your Next Steps for Success
            </h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-medium text-green-800 mb-2">Build on Your Strengths</h5>
                <ul className="space-y-1 text-sm">
                  {score.strengths.slice(0, 2).map((strength, index) => (
                    <li key={index} className="text-green-700">• {strength}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-blue-800 mb-2">Focus Areas</h5>
                <ul className="space-y-1 text-sm">
                  {score.improvementAreas.slice(0, 2).map((area, index) => (
                    <li key={index} className="text-blue-700">• {area}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resume Advice Section */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Resume Enhancement Tips
          </h3>
          <button
            onClick={() => setShowResumeAdvice(!showResumeAdvice)}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center"
          >
            {showResumeAdvice ? 'Hide' : 'Show'} Tips
            <svg 
              className={`w-4 h-4 ml-1 transform transition-transform ${showResumeAdvice ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {showResumeAdvice && (
          <div className="space-y-4 text-sm text-gray-700">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Based on Your Interview</h4>
                <ul className="space-y-1">
                  <li>• Highlight specific projects mentioned in your responses</li>
                  <li>• Quantify achievements where possible</li>
                  <li>• Add keywords from technologies you discussed</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">General Improvements</h4>
                <ul className="space-y-1">
                  <li>• Use action verbs to describe accomplishments</li>
                  <li>• Include relevant certifications or training</li>
                  <li>• Ensure consistent formatting throughout</li>
                </ul>
              </div>
            </div>
            {resumeData.feedback && (
              <div className="mt-4 p-4 bg-white rounded border">
                <h4 className="font-medium text-gray-900 mb-2">
                  Your Resume Score: {resumeData.feedback.score}/100
                </h4>
                <p className="text-sm text-gray-600">{resumeData.feedback.contentQuality}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
        <button
          onClick={onStartNewInterview}
          className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Take Another Interview
        </button>
        
        <button
          onClick={() => window.print()}
          className="w-full sm:w-auto px-8 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Download Results
        </button>
      </div>

      {/* Encouragement Message */}
      <div className="text-center p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Keep Growing! 🌟
        </h3>
        <p className="text-gray-700">
          Every interview is a learning opportunity. Use this feedback to enhance your skills and
          approach your next real interview with confidence!
        </p>
      </div>
    </div>
  );
}