/**
 * WarningBanner Component
 * Displays warnings and readable notes from source identification API
 * Dismissible banner at top of /source-analysis page
 */

import { useState } from 'react';

function WarningBanner({ warnings, notes_readable }) {
  const [dismissed, setDismissed] = useState(false);
  
  // Don't render if dismissed or no warnings/notes
  if (dismissed || (!warnings || warnings.length === 0) && !notes_readable) {
    return null;
  }
  
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <svg
              className="h-5 w-5 text-yellow-400 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <h3 className="text-sm font-semibold text-yellow-800">
              Data Quality Information
            </h3>
          </div>
          
          {warnings && warnings.length > 0 && (
            <ul className="list-disc list-inside space-y-1 mb-3">
              {warnings.map((warning, index) => (
                <li key={index} className="text-sm text-yellow-700">
                  {warning}
                </li>
              ))}
            </ul>
          )}
          
          {notes_readable && (
            <div className="mt-2 pt-2 border-t border-yellow-200">
              <p className="text-sm text-yellow-700 italic">
                {notes_readable}
              </p>
            </div>
          )}
        </div>
        
        <button
          onClick={() => setDismissed(true)}
          className="ml-4 text-yellow-600 hover:text-yellow-800 focus:outline-none"
          aria-label="Dismiss warning"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default WarningBanner;

