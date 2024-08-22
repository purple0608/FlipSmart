import React from 'react';

const ProductCard = ({ title, price, imgSrc }) => {
  return (
    <div className="card-item p-4 border rounded-lg shadow-md">
      <img src={imgSrc} alt={title} className="w-full h-48 object-cover mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-blue-600 font-semibold">{price}</p>
    </div>
  );
};

export default ProductCard;
