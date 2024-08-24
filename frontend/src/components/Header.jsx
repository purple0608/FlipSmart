import React from 'react';

const Header = () => {
  return (
    <header className="bg-blue-600 p-4 flex flex-col sm:flex-row items-center justify-between">
      <div className="logo">
        <img src="flipkart.webp" alt="Logo" className="w-40" />
      </div>
      <nav>
        <ul className="flex space-x-10 text-white text-lg">
          <li><a href="#">Home</a></li>
          <li><a href="#">Products</a></li>
          <li><a href="#">Deals</a></li>
          <li><a href="#">Contact</a></li>
        </ul>
      </nav>
      <div className="search flex items-center">
        <input type="text" placeholder="Search for products..." className="p-2 rounded-lg w-64" />
        <button className="bg-white text-blue-600 p-2 rounded-lg ml-4 mr-5 hover:bg-blue-900">Search</button>
      </div>
    </header>
  );
};

export default Header;
