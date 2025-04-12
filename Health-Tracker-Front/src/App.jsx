import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";

import "./css/style.css";
import "./charts/ChartjsConfig";

import Chat from "./pages/Chat";
import Dashboard from "./pages/Dashboard";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Forum from "./pages/Forum";
import CalorieCalculator from "./components/Calculator";


const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const location = useLocation();
  return token ? (
    children
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  );
};

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userId, setUserId] = useState(localStorage.getItem("userId")); 

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUserId = localStorage.getItem("userId");

  
    if (token && storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo({ top: 0 });
      document.documentElement.style.scrollBehavior = "smooth";
    }
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/messages/:id" element={<ProtectedRoute><Chat userId={userId} /></ProtectedRoute>} />
      <Route path="/forum" element={<ProtectedRoute><Forum userId={userId} /></ProtectedRoute>} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/calculator" element={<CalorieCalculator/>}/>
    </Routes>
  );
}

export default App;