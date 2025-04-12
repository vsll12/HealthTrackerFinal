import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import Header from "../partials/Header";
import Sidebar from "../partials/Sidebar";
import CalorieCalculator from "../components/Calculator";

const Profile = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const token = localStorage.getItem("token");
  const [formData, setFormData] = useState({
    age: "",
    weight: "",
    height: "",
  });

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
              <CalorieCalculator />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
