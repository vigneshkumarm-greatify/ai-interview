'use client';

import { useState } from 'react';
import ResumeUpload from '@/components/ResumeUpload';
import InterviewChat from '@/components/InterviewChat';
import Results from '@/components/Results';
import { ParsedResume, InterviewStep, FinalScore } from '@/types/interview';

export default function Home() {
  const [currentStep, setCurrentStep] = useState<InterviewStep>('upload-resume');
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
  const [responses, setResponses] = useState<Array<{questionId: string, transcript: string, audioUrl: string, question: string, score?: number, feedback?: string}>>([]);
  const [finalScore, setFinalScore] = useState<FinalScore | null>(null);
  const [isCalculatingScore, setIsCalculatingScore] = useState(false);

  const handleResumeUploaded = (resume: ParsedResume) => {
    setParsedResume(resume);
    setCurrentStep('ready-to-start');
  };

  const startInterview = () => {
    if (!parsedResume) return;
    setCurrentStep('recording');
  };

  const handleInterviewComplete = async (interviewResponses: Array<{questionId: string, transcript: string, audioUrl: string, question: string, score?: number, feedback?: string}>) => {
    setResponses(interviewResponses);
    setCurrentStep('completed');
    
    // Calculate final score
    setIsCalculatingScore(true);
    try {
      await calculateFinalScore(interviewResponses);
    } catch (error) {
      console.error('Failed to calculate final score:', error);
      setIsCalculatingScore(false);
    }
  };

  const calculateFinalScore = async (interviewResponses: typeof responses) => {
    try {
      console.log('📊 Calculating final interview score...');
      
      const response = await fetch('/api/calculate-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responses: interviewResponses.map(r => ({
            question: r.question,
            transcript: r.transcript,
            score: r.score || 0,
            feedback: r.feedback || '',
            analysis: {
              communication: Math.floor((r.score || 0) * 0.25),
              content: Math.floor((r.score || 0) * 0.30),
              experience: Math.floor((r.score || 0) * 0.25),
              performance: Math.floor((r.score || 0) * 0.20)
            }
          })),
          role: 'Software Developer', // This should be passed from InterviewChat
          resumeContext: parsedResume ? {
            name: parsedResume.personalInfo.name,
            experience: parsedResume.experience.map(exp => `${exp.role} at ${exp.company}`).join(', '),
            skills: parsedResume.skills
          } : { name: '', experience: '', skills: [] }
        }),
      });

      if (response.ok) {
        const scoreData = await response.json();
        if (scoreData.success) {
          setFinalScore({
            overallScore: scoreData.overallScore,
            breakdown: scoreData.breakdown,
            strengths: scoreData.strengths,
            improvementAreas: scoreData.improvementAreas,
            detailedFeedback: scoreData.detailedFeedback,
            recommendations: scoreData.recommendations
          });
          console.log('✅ Final score calculated:', scoreData.overallScore);
        }
      }
    } catch (error) {
      console.error('❌ Failed to calculate final score:', error);
    } finally {
      setIsCalculatingScore(false);
    }
  };

  const startNewInterview = () => {
    setCurrentStep('upload-resume');
    setParsedResume(null);
    setResponses([]);
    setFinalScore(null);
    setIsCalculatingScore(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            AI Voice Interview
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Practice your interview skills with AI-powered feedback
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <StepIndicator 
              step={1} 
              label="Upload Resume" 
              isActive={currentStep === 'upload-resume' || currentStep === 'processing-resume'}
              isCompleted={parsedResume !== null}
            />
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <StepIndicator 
              step={2} 
              label="Voice Interview" 
              isActive={currentStep === 'recording' || currentStep === 'processing-response'}
              isCompleted={false}
            />
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <StepIndicator 
              step={3} 
              label="Results" 
              isActive={currentStep === 'completed'}
              isCompleted={false}
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {currentStep === 'upload-resume' && (
            <ResumeUpload onResumeUploaded={handleResumeUploaded} />
          )}

          {currentStep === 'ready-to-start' && parsedResume && (
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Resume Uploaded Successfully!
              </h2>
              
              {/* Resume Summary */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
                <h3 className="font-semibold text-lg mb-3">Resume Summary</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Name:</span> {parsedResume.personalInfo.name}</p>
                  <p><span className="font-medium">Experience:</span> {parsedResume.experience.length} positions</p>
                  <p><span className="font-medium">Skills:</span> {parsedResume.skills.slice(0, 5).join(', ')}
                    {parsedResume.skills.length > 5 && ` +${parsedResume.skills.length - 5} more`}
                  </p>
                </div>
              </div>

              {/* Resume Feedback */}
              {parsedResume.feedback && (
                <div className="bg-blue-50 rounded-lg p-6 mb-6 text-left">
                  <h3 className="font-semibold text-lg mb-3">Resume Quality Score: {parsedResume.feedback.score}/100</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-green-700">Strengths:</p>
                      <ul className="list-disc list-inside text-gray-700">
                        {parsedResume.feedback.strengths.map((strength, idx) => (
                          <li key={idx}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-amber-700">Areas for Improvement:</p>
                      <ul className="list-disc list-inside text-gray-700">
                        {parsedResume.feedback.improvements.map((improvement, idx) => (
                          <li key={idx}>{improvement}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-gray-600 mb-6">
                We've analyzed your resume and prepared personalized interview questions. 
                Make sure you're in a quiet environment with a working microphone.
              </p>

              <button
                onClick={startInterview}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Start Interview
              </button>
            </div>
          )}

          {currentStep === 'recording' && parsedResume && (
            <InterviewChat
              resume={parsedResume}
              onInterviewComplete={handleInterviewComplete}
            />
          )}

          {currentStep === 'completed' && (
            <>
              {isCalculatingScore && (
                <div className="text-center max-w-2xl mx-auto">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Analyzing Your Performance...
                  </h2>
                  <div className="bg-blue-50 rounded-lg p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">
                      Our AI is carefully analyzing your interview responses and calculating your comprehensive score. This may take a moment.
                    </p>
                  </div>
                </div>
              )}
              
              {!isCalculatingScore && finalScore && parsedResume && (
                <Results 
                  score={finalScore}
                  resumeData={parsedResume}
                  onStartNewInterview={startNewInterview}
                />
              )}
              
              {!isCalculatingScore && !finalScore && responses.length > 0 && (
                <div className="text-center max-w-2xl mx-auto">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    🎉 Interview Complete!
                  </h2>
                  
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 mb-6">
                    <h3 className="font-semibold text-lg mb-4">Interview Summary</h3>
                    <div className="space-y-4 text-left">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Questions Answered:</span>
                          <span className="ml-2 text-gray-900">{responses.length}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Total Responses:</span>
                          <span className="ml-2 text-gray-900">{responses.reduce((acc, r) => acc + r.transcript.split(' ').length, 0)} words</span>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Sample Response:</h4>
                        <p className="text-gray-700 text-sm italic">
                          "{responses[0]?.transcript.substring(0, 100)}..."
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-6">
                    Unable to calculate final score. Your responses have been recorded.
                  </p>

                  <button
                    onClick={startNewInterview}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Start New Interview
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// Step Indicator Component
function StepIndicator({ 
  step, 
  label, 
  isActive, 
  isCompleted 
}: { 
  step: number; 
  label: string; 
  isActive: boolean; 
  isCompleted: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className={`
        w-10 h-10 rounded-full flex items-center justify-center font-medium
        ${isCompleted ? 'bg-green-600 text-white' : 
          isActive ? 'bg-blue-600 text-white' : 
          'bg-gray-300 text-gray-600'}
      `}>
        {isCompleted ? (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : step}
      </div>
      <span className={`
        mt-2 text-sm font-medium
        ${isActive ? 'text-blue-600' : 'text-gray-600'}
      `}>
        {label}
      </span>
    </div>
  );
}