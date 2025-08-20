import React, { useState, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import { demoProducts } from '../data/demoProducts';

/**
 * A reusable toggle button component with encapsulated functionality for demo mode
 * 
 * @param {string} className - Additional CSS classes for the toggle button
 * @param {function} onSelectedProductChange - Optional callback when product selection changes
 * @returns {JSX.Element} - The toggle button component
 */
const ToggleButton = ({ className = "", onSelectedProductChange }) => {
  const [isActive, setIsActive] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const { setDemoModeState, clearHistory, chat, isDemoMode, setProductContext, contextOverride } = useChat();
  
  // Sync with chat context demo mode state if it changes externally
  useEffect(() => {
    if (isDemoMode !== isActive) {
      setIsActive(isDemoMode);
    }
  }, [isDemoMode, isActive]);

  const handleToggle = async () => {
    const newActiveState = !isActive;
    setIsActive(newActiveState);
    setDemoModeState(newActiveState);
    
    if (newActiveState) {
      clearHistory();
      setShowProductSelector(true);
    } else {
      // Reset context override when turning off demo mode
      setSelectedProduct(null);
      await setProductContext(null);
      console.log("Demo mode disabled, context reset to default");
      clearHistory();
      if (onSelectedProductChange) {
        onSelectedProductChange(null);
      }
    //   setTimeout(() => { chat(""); }, 500); // Trigger default greeting
    }
  };
  
  // When product is selected in demo mode
  const handleProductSelect = async (product) => {
    // Close product selector
    setShowProductSelector(false);
    setSelectedProduct(product);

    // Clear any existing chat history
    clearHistory();
    
    // Only update context if it's different from current context
    if (contextOverride !== product.contextOverride) {
      console.log("Context changed, updating product context override: ", product.contextOverride);
      await setProductContext(product.contextOverride);
    } else {
      console.log("Context unchanged, reusing existing context");
    }
    
    // Notify parent component of product selection
    if (onSelectedProductChange) {
      onSelectedProductChange(product);
    }
  };

  useEffect(() => {
    console.log("Product context override set", contextOverride);
    if(contextOverride) {
      chat("Hi, I would like to see a demo of " + selectedProduct.name);
    }
  }, [contextOverride]);

  return (
    <>
      <button
        onClick={handleToggle}
        className={`flex items-center gap-2 ${className}`}
      >
        <span className="text-white text-sm mr-2">
          {isActive ? "Demo Mode: ON" : "Demo Mode: OFF"}
        </span>
        <div 
          className={`w-12 h-6 flex items-center rounded-full p-1 duration-300 ease-in-out ${
            isActive ? 'bg-green-500' : 'bg-gray-400'
          }`}
        >
          <div 
            className={`bg-white w-5 h-5 rounded-full shadow-md transform duration-300 ease-in-out ${
              isActive ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </div>
      </button>
      
      {/* Product Selector Modal - Updated with transparent background and gradient borders */}
      {isActive && showProductSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black bg-opacity-80 rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-blue-400">
            <h2 className="text-2xl font-semibold mb-4 text-white">Select InfoEdge Product</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {demoProducts.map((product) => (
                <div 
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  className="border rounded-lg p-4 cursor-pointer transition-all duration-300 
                            bg-gradient-to-r from-blue-900/50 to-purple-900/50
                            hover:from-blue-700/70 hover:to-purple-400/70
                            border-transparent hover:border-blue-300 text-white"
                >
                  <h3 className="text-lg font-semibold">{product.name}</h3>
                  <p className="text-sm text-gray-300">{product.category}</p>
                  <p className="mt-2 text-gray-100">{product.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => {
                  setShowProductSelector(false);
                  setIsActive(false);
                  setDemoModeState(false);
                }}
                className="bg-gradient-to-r from-blue-700 to-purple-400 text-white font-medium py-2 px-4 rounded-md hover:opacity-90 transition-opacity"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ToggleButton;
