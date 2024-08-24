import React, { useEffect, useState } from 'react';
import { productImages } from './productImages'; // Import the image mappings
import productData from '../../../backend/productData.json'; // Import the JSON data directly

// Helper function to sort products by clicks and ratings
const sortProducts = (products) => {
  return Object.values(products)
    .sort((a, b) => {
      // Sort by clicks first, then by rating
      return b.clicks - a.clicks || parseFloat(b.rating) - parseFloat(a.rating);
    });
};

const TopProducts = () => {
  const [products, setProducts] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    // Set products from imported JSON data
    setProducts(productData);
  }, []);

  useEffect(() => {
    // Update top products when product data changes
    const updatedTopProducts = sortProducts(products).slice(0, 4); // Get top 4 products
    setTopProducts(updatedTopProducts);
  }, [products]);

  return (
    <div className="p-6 bg-transparent" style={{ marginRight: '850px'}}> {/* Adjust marginLeft for sidebar */}
      <h2 className="text-2xl p-4 font-semibold text-blue-600 bg-gradient-to-r from-blue-800 to-purple-800 bg-clip-text text-transparent">
        Top Product Recommendations
      </h2>
      {topProducts.length === 0 ? (
        <p className="text-center text-gray-500">No products available</p>
      ) : (
        <div className="flex flex-wrap gap-4">
          {topProducts.map((product) => (
            <div
              key={product.title}
              className="bg-white border border-gray-300 rounded-lg shadow-md flex-none"
              style={{ width: '150px' }} // Adjust width as needed
            >
              <img
                src={productImages[product.title] || 'default-image.jpg'} // Fallback image if none is found
                alt={product.title}
                className="w-full h-32 object-cover rounded-t-lg" // Adjust height as needed
              />
              <div className="p-2">
                <h3 className="text-sm font-semibold mb-1">{product.title}</h3>
                <p className="text-blue-600 font-semibold text-xs">{product.price}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopProducts;
