import React from 'react';

const ProductSelector = ({ products, onSelect }) => {
  return (
    <div className="product-selector-container">
      <h2 className="text-xl font-bold mb-4 text-center">Select a Product for Demo</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product, index) => (
          <div 
            key={product.id} 
            className="product-card bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer"
            style={{ '--index': index }}
            onClick={() => onSelect(product)}
          >
            <div className="flex items-center mb-2">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <img 
                  src={product.image || `/product-${index + 1}.png`} 
                  alt={product.name}
                  className="w-10 h-10 object-contain rounded-full"
                  onError={(e) => {
                    e.target.src = '/product-placeholder.png';
                  }}
                />
              </div>
              <h3 className="font-semibold text-lg">{product.name}</h3>
            </div>
            
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.shortDescription}</p>
            
            <div className="flex justify-between items-center">
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {product.category}
              </span>
              <button 
                className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md"
              >
                Select
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductSelector;
