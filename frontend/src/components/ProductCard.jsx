import React, { useEffect, useState } from 'react';

// Helper functions for cookie management
const setCookie = (name, value, days) => {
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = `; expires=${date.toUTCString()}`;
  }
  document.cookie = `${name}=${value || ''}${expires}; path=/`;
};

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

const ProductCard = ({ title, price, rating, description, imgSrc }) => {
  const [clicks, setClicks] = useState(0);

  useEffect(() => {
    // Retrieve the existing product data from session storage or cookies
    const storedSessionData = JSON.parse(sessionStorage.getItem(title)) || { clicks: 0 };
    const storedCookieData = getCookie(title) ? JSON.parse(getCookie(title)) : null;

    // Prefer cookie data if available, otherwise use session storage
    const productData = storedCookieData || storedSessionData;
    setClicks(productData.clicks);
  }, [title]);

  const handleClick = () => {
    // Update the clicks state
    const newClicks = clicks + 1;
    setClicks(newClicks);

    // Update both session storage and cookies with the new product data
    const productData = {
      title,
      price,
      rating,
      description,
      clicks: newClicks,
    };

    // Store in session storage
    sessionStorage.setItem(title, JSON.stringify(productData));

    // Store in cookies
    setCookie(title, JSON.stringify(productData), 7); // Store for 7 days

    // Optionally, log to the console for verification
    console.log(productData);
  };

  // Determine the rating color based on the rating value
  const ratingColor = parseFloat(rating) >= 4.5 ? 'text-green-500' : 'text-gray-600';

  return (
    <div className="card-item p-4 border rounded-lg shadow-md" onClick={handleClick}>
      <img src={imgSrc} alt={title} className="w-full h-48 object-cover mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-blue-600 font-semibold mb-2">{price}</p>
      <p className={`mb-2 ${ratingColor}`}>Rating: {rating}</p>
      <p className="text-gray-600 mb-2">{description}</p>
      <p className="text-gray-600">Clicks: {clicks}</p>
    </div>
  );
};

export default ProductCard;
