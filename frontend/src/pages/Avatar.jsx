import React, { useState } from "react";
import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import { Experience } from "../components/Experience";
import { UI } from "../components/UI";
import ToggleButton from "../components/ToggleButton";

function Avatar() {
  // State to track selected product for iframe display
  const [selectedProduct, setSelectedProduct] = useState(null);

  return (
    <div className="flex h-screen">
      {/* Demo Mode Toggle - Fixed at top right */}
      <div className="bg-gradient-to-r from-blue-700 to-purple-400 p-2 rounded-md shadow-lg absolute bottom-8 right-20 z-50 pointer-events-auto">
        <ToggleButton 
          className="pointer-events-auto" 
          onSelectedProductChange={setSelectedProduct}
        />
      </div>
      
      {/* Main Content Area */}
      <div className="flex flex-1">
        {/* Demo Mode: 60/40 split when active and product selected */}
        {selectedProduct ? (
          <>
            {/* Product Website - 60% width */}
            <div className="w-1/2 border-l border-gray-300">
              <iframe
                src={selectedProduct.website}
                title={selectedProduct.name}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            </div>
            
            {/* Chat and Avatar - 40% width */}
            <div className="w-1/2 h-full bg-gray-900 flex flex-col">
              <Loader />
              <Leva hidden />
              <UI />
              <Canvas 
                shadows 
                camera={{ position: [0, 0, 1], fov: 30 }}
              >
                <Experience />
              </Canvas>
            </div>
          </>
        ) : (
          // Standard Mode: Full width for chat and avatar
          <div className="w-full h-full flex flex-col">
            <Loader />
            <Leva hidden />
            <UI />
            <Canvas shadows camera={{ position: [0, 0, 1], fov: 30 }}>
              <Experience />
            </Canvas>
          </div>
        )}
      </div>
    </div>
  );
}

export default Avatar;
