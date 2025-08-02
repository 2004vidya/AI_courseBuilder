
import React from "react";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import CourseView from "./pages/CourseView";

function App() {  
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/course" element={<div className="text-white p-10">Please select a course or <a href="/" className="text-blue-400 underline">generate a new one</a></div>} />
      <Route path="/course/:courseId" element={<CourseView />} />
    </Routes>
  );
}

export default App; 