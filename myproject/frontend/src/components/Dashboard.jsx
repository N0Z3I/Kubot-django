import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import axiosInstance from "../utils/axiosInstance";

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  // ตรวจสอบว่า login อยู่ไหม
  useEffect(() => {
    const accessToken = Cookies.get("access");
    if (!accessToken) {
      navigate("/login");
    } else {
      fetchUserData();
    }
  }, []);

  // ดึงข้อมูลผู้ใช้จาก backend
  const fetchUserData = async () => {
    try {
      const res = await axiosInstance.get("/auth/myku-data/");
      if (res.status === 200) {
        setUserData(res.data);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      toast.error("ไม่สามารถดึงข้อมูลผู้ใช้ได้");
    }
  };

  // แสดงข้อมูลใน dashboard
  return (
    <div>
      <h1>Dashboard</h1>
      {userData ? (
        <div>
          <p>ยินดีต้อนรับ {userData.full_name}</p>
          <p>อีเมล: {userData.email}</p>
          <p>รหัสนิสิต: {userData.student_id}</p>
          {/* สามารถแสดงข้อมูลอื่นๆ ได้ตามที่ต้องการ */}
        </div>
      ) : (
        <p>กำลังโหลดข้อมูล...</p>
      )}
    </div>
  );
};

export default Dashboard;
