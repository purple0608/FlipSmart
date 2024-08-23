import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ChatProvider } from "./hooks/useChat";
import "./index.css";
import { AvatarProvider } from "./hooks/AvatarProvider";  

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ChatProvider>
      <AvatarProvider>
        <App />
      </AvatarProvider>
    </ChatProvider>
  </React.StrictMode>
);
