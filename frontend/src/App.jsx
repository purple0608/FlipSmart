import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Avatar from "./pages/Avatar";
import Home from "./pages/Home";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/avatar" element={<Avatar />} />
        {/* Add other routes here */}
      </Routes>
    </Router>
  );
}

export default App;
