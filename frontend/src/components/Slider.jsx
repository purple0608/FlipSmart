import React, { useState, useEffect } from 'react';

const images = [
  'slider1.jpg',
  'slider2.jpg',
  'slider3.jpg',
  'slider4.jpg',
];

const Slider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-4/5 mx-auto mt-4 overflow-hidden rounded-lg shadow-lg h-64">
      <div
        className="flex transition-transform duration-1000 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((image, index) => (
          <img 
            key={index}
            src={image} 
            alt={`Slider ${index}`} 
            className="w-full h-full object-cover"
          />
        ))}
      </div>
    </div>
  );
};

export default Slider;
