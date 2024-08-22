import React from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'react-lottie';
import animationData from './animation.json'; // Adjust the path if necessary

const AiAssistantButton = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/avatar');
  };

  const defaultOptions = {
    loop: true,
    autoplay: true, 
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice'
    }
  };

  return (
    <div className="fixed bottom-8 right-8">
      {/* Container for positioning */}
      <div className="relative">
        <Lottie 
          options={defaultOptions} 
          height={100} 
          width={100} 
          className="absolute -top-20 right-0 z-10"
        />
        <button
          onClick={handleClick}
          className="p-4 rounded-full shadow-lg bg-gradient-to-r from-blue-500 via-pink-500 to-blue-800 hover:bg-slate-400 text-white text-lg font-semibold"
        >
          Talk to Flipkart Assistant
        </button>
      </div>
    </div>
  );
};

export default AiAssistantButton;
