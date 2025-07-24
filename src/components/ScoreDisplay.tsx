'use client';

import { FinalScore } from '@/types/interview';

interface ScoreDisplayProps {
  score: FinalScore;
  className?: string;
}

export default function ScoreDisplay({ score, className = '' }: ScoreDisplayProps) {
  const getScoreColor = (value: number, max: number) => {
    const percentage = (value / max) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBarColor = (value: number, max: number) => {
    const percentage = (value / max) * 100;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getOverallScoreColor = (value: number) => {
    if (value >= 80) return 'text-green-600 border-green-200 bg-green-50';
    if (value >= 60) return 'text-yellow-600 border-yellow-200 bg-yellow-50';
    return 'text-red-600 border-red-200 bg-red-50';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Score */}
      <div className={`text-center p-6 rounded-lg border-2 ${getOverallScoreColor(score.overallScore)}`}>
        <h3 className="text-lg font-semibold mb-2">Overall Interview Score</h3>
        <div className="text-4xl font-bold mb-2">
          {score.overallScore}/100
        </div>
        <div className="text-sm opacity-80">
          {score.overallScore >= 80 ? 'Excellent Performance' :
           score.overallScore >= 70 ? 'Strong Performance' :
           score.overallScore >= 60 ? 'Good Performance' :
           score.overallScore >= 50 ? 'Satisfactory Performance' :
           'Needs Improvement'}
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold mb-4 text-gray-900">Score Breakdown</h4>
        <div className="space-y-4">
          
          {/* Communication */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Communication</span>
              <span className={`font-semibold ${getScoreColor(score.breakdown.communication, 25)}`}>
                {score.breakdown.communication}/25
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${getScoreBarColor(score.breakdown.communication, 25)}`}
                style={{ width: `${(score.breakdown.communication / 25) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">
              Clarity, articulation, and professional presentation
            </p>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Technical Content</span>
              <span className={`font-semibold ${getScoreColor(score.breakdown.content, 30)}`}>
                {score.breakdown.content}/30
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${getScoreBarColor(score.breakdown.content, 30)}`}
                style={{ width: `${(score.breakdown.content / 30) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">
              Technical accuracy, depth of knowledge, and problem-solving approach
            </p>
          </div>

          {/* Experience */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Experience</span>
              <span className={`font-semibold ${getScoreColor(score.breakdown.experience, 25)}`}>
                {score.breakdown.experience}/25
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${getScoreBarColor(score.breakdown.experience, 25)}`}
                style={{ width: `${(score.breakdown.experience / 25) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">
              Relevant work experience and real-world application
            </p>
          </div>

          {/* Performance */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Interview Performance</span>
              <span className={`font-semibold ${getScoreColor(score.breakdown.performance, 20)}`}>
                {score.breakdown.performance}/20
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${getScoreBarColor(score.breakdown.performance, 20)}`}
                style={{ width: `${(score.breakdown.performance / 20) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">
              Response completeness and overall interview effectiveness
            </p>
          </div>
        </div>
      </div>

      {/* Strengths */}
      <div className="bg-green-50 rounded-lg border border-green-200 p-6">
        <h4 className="text-lg font-semibold mb-3 text-green-800 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Strengths
        </h4>
        <ul className="space-y-2">
          {score.strengths.map((strength, index) => (
            <li key={index} className="text-green-700 flex items-start">
              <span className="text-green-500 mr-2">•</span>
              <span>{strength}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Areas for Improvement */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <h4 className="text-lg font-semibold mb-3 text-blue-800 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Areas for Improvement
        </h4>
        <ul className="space-y-2">
          {score.improvementAreas.map((area, index) => (
            <li key={index} className="text-blue-700 flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>{area}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Recommendations */}
      <div className="bg-purple-50 rounded-lg border border-purple-200 p-6">
        <h4 className="text-lg font-semibold mb-3 text-purple-800 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          Recommendations
        </h4>
        <ul className="space-y-2">
          {score.recommendations.map((recommendation, index) => (
            <li key={index} className="text-purple-700 flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span>{recommendation}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}