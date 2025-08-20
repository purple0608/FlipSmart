import React, { useState } from 'react';

/**
 * A circular toggle button for collapsing/expanding the chat interface with self-contained state
 * 
 * @param {function} onToggle - Optional callback when chat visibility changes
 * @param {string} className - Additional CSS classes for the toggle button
 * @returns {JSX.Element} - The chat toggle button component
 */
const ChatToggle = ({ onToggle, className = "" }) => {
  const [isOpen, setIsOpen] = useState(true);
  
  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    
    if (onToggle) {
      onToggle(newState);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg 
      bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700
      transition-all duration-300 ${className}`}
      title={isOpen ? "Collapse Chat" : "Open Chat"}
    >
      {isOpen ? (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6 text-white" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M6 18L18 6M6 6l12 12" 
          />
        </svg>
      ) : (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6 text-white" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" 
          />
        </svg>
      )}
    </button>
  );
};

export default ChatToggle;
