import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

const StudentProfile = () => {
  const [studentData, setStudentData] = useState(null);
  const navigate = useNavigate();
  const refresh = Cookies.get("refresh");

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("studentData"));
    if (data) {
      setStudentData(data);
    }
  }, []);

  useEffect(() => {
    if (!Cookies.get("access") || !Cookies.get("user")) {
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const res = await axiosInstance.post("/auth/logout/", {
        refresh_token: refresh,
      });
      if (res.status === 200) {
        Cookies.remove("access");
        Cookies.remove("refresh");
        Cookies.remove("user");
        localStorage.removeItem("studentData");
        navigate("/login");
        toast.success("Logout successful");
      }
    } catch (error) {
      console.error(error);
      toast.error("Logout failed. Please try again.");
      navigate("/login");
    }
  };

  if (!studentData) {
    return (
      <div>
        <h1>Loading...</h1>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1>Student Profile</h1>
      <p>Student Code: {studentData.student_code}</p>
      {/* Display other student data as needed */}
      <button onClick={handleLogout} className="logout-btn">
        Logout
      </button>
    </div>
  );
};

export default StudentProfile;
