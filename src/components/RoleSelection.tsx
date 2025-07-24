'use client';

import React, { useState } from 'react';

interface RoleSelectionProps {
  onRoleSelected: (role: string, roleDetails: string) => void;
}

const commonRoles = [
  {
    title: 'Frontend Developer',
    description: 'React, Vue, Angular, JavaScript, TypeScript, CSS',
    keywords: 'frontend, react, javascript, ui, ux'
  },
  {
    title: 'Backend Developer', 
    description: 'Node.js, Python, Java, APIs, Databases, Microservices',
    keywords: 'backend, api, database, server, microservices'
  },
  {
    title: 'Full Stack Developer',
    description: 'Frontend + Backend, MEAN/MERN stack, DevOps',
    keywords: 'fullstack, full-stack, mean, mern, end-to-end'
  },
  {
    title: 'DevOps Engineer',
    description: 'AWS, Docker, Kubernetes, CI/CD, Infrastructure',
    keywords: 'devops, aws, docker, kubernetes, ci/cd'
  },
  {
    title: 'Data Scientist',
    description: 'Python, Machine Learning, Statistics, Analytics',
    keywords: 'data, ml, python, analytics, statistics'
  },
  {
    title: 'Product Manager',
    description: 'Strategy, Roadmaps, User Research, Analytics',
    keywords: 'product, manager, strategy, roadmap'
  }
];

export default function RoleSelection({ onRoleSelected }: RoleSelectionProps) {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [customRole, setCustomRole] = useState<string>('');
  const [roleDescription, setRoleDescription] = useState<string>('');
  const [showCustom, setShowCustom] = useState(false);

  const handleRoleSelect = (role: string, description: string) => {
    setSelectedRole(role);
    setRoleDescription(description);
    setShowCustom(false);
  };

  const handleCustomRole = () => {
    setShowCustom(true);
    setSelectedRole('');
  };

  const handleSubmit = () => {
    const finalRole = showCustom ? customRole : selectedRole;
    const finalDescription = showCustom ? roleDescription : 
      commonRoles.find(r => r.title === selectedRole)?.description || '';
    
    if (finalRole.trim()) {
      onRoleSelected(finalRole, finalDescription);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          What role are you interviewing for?
        </h2>
        <p className="text-gray-600">
          This helps me ask more relevant questions based on the position
        </p>
      </div>

      {!showCustom ? (
        <div className="space-y-4 mb-6">
          {commonRoles.map((role) => (
            <button
              key={role.title}
              onClick={() => handleRoleSelect(role.title, role.description)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                selectedRole === role.title
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{role.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                </div>
                {selectedRole === role.title && (
                  <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>
          ))}
          
          <button
            onClick={handleCustomRole}
            className="w-full text-left p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-gray-600">Other / Custom role</span>
            </div>
          </button>
        </div>
      ) : (
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role Title
            </label>
            <input
              type="text"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              placeholder="e.g., Senior iOS Developer, ML Engineer, UX Designer"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Key Skills/Technologies (Optional)
            </label>
            <textarea
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
              placeholder="e.g., Swift, SwiftUI, Core Data, iOS SDK, App Store deployment"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={() => setShowCustom(false)}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            ← Back to common roles
          </button>
        </div>
      )}

      <div className="text-center">
        <button
          onClick={handleSubmit}
          disabled={!selectedRole && !customRole.trim()}
          className={`px-8 py-3 rounded-lg font-medium transition-colors ${
            (selectedRole || customRole.trim())
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Continue to Interview
        </button>
      </div>
    </div>
  );
}