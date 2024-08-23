import React, { createContext, useState } from 'react';

// Create the context
export const AvatarContext = createContext();

// Create the provider component
export const AvatarProvider = ({ children }) => {
  const [avatar, setAvatar] = useState("/animations.glb");

  return (
    <AvatarContext.Provider value={{ avatar, setAvatar }}>
      {children}
    </AvatarContext.Provider>
  );
};
