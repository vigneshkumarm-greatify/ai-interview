'use client';

import React, { useState, useCallback } from 'react';
import { ParsedResume } from '@/types/interview';

interface ResumeUploadProps {
  onResumeUploaded: (resume: ParsedResume) => void;
}

export default function ResumeUpload({ onResumeUploaded }: ResumeUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleFile = async (file: File) => {
    setError(null);
    setUploadedFile(file);

    // Client-side validation
    const allowedTypes = ['application/pdf', 'text/plain'];
    const allowedExtensions = ['.pdf', '.txt'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (file.size > maxSize) {
      setError('File size must be less than 10MB');
      return;
    }

    const hasValidType = allowedTypes.includes(file.type);
    const hasValidExtension = allowedExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidType && !hasValidExtension) {
      setError('Please upload a PDF or TXT file');
      return;
    }

    // Upload and parse
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch('/api/parse-resume-robust', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to parse resume');
      }

      // Store parsed resume in localStorage
      localStorage.setItem('parsedResume', JSON.stringify(result.data));
      
      // Notify parent component
      onResumeUploaded(result.data);
      
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload resume');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Upload Your Resume
        </h2>
        <p className="text-gray-600">
          Upload your resume to begin the AI-powered interview process
        </p>
      </div>

      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8
          transition-colors duration-200 ease-in-out
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${error ? 'border-red-300 bg-red-50' : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="resume-upload"
          className="sr-only"
          accept=".pdf,.txt"
          onChange={handleFileInput}
          disabled={isUploading}
        />

        <label
          htmlFor="resume-upload"
          className={`
            flex flex-col items-center justify-center
            ${isUploading ? 'cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-700">Processing your resume...</p>
            </>
          ) : (
            <>
              <svg
                className="w-12 h-12 text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              
              <p className="text-lg font-medium text-gray-700 mb-1">
                {uploadedFile ? uploadedFile.name : 'Drop your resume here'}
              </p>
              <p className="text-sm text-gray-500">
                or click to browse
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Supported formats: PDF, TXT (Max 10MB)
              </p>
            </>
          )}
        </label>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600 flex items-center">
            <svg
              className="w-4 h-4 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        </div>
      )}

      {uploadedFile && !error && !isUploading && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600 flex items-center">
            <svg
              className="w-4 h-4 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Resume uploaded successfully!
          </p>
        </div>
      )}
    </div>
  );
}