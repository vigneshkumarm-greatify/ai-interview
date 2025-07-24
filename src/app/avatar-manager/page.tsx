'use client';

import AvatarManager from '@/components/AvatarManager';

export default function AvatarManagerPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Avatar Manager
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage HeyGen avatars for your AI interview system
              </p>
            </div>
            <a
              href="/"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              ← Back to Interview
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-12">
        <AvatarManager />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            <p>
              This tool helps you fetch and configure HeyGen avatars for your AI interview system.
              <br />
              For more information, visit{' '}
              <a 
                href="https://docs.heygen.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700"
              >
                HeyGen Documentation
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}