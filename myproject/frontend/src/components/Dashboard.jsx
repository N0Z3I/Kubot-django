import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  const accessToken = Cookies.get("access");

  // ตรวจสอบว่า login อยู่ไหม
  useEffect(() => {
    if (!accessToken) {
      navigate("/login");
    } else {
      fetchUserData();
    }
  }, [accessToken]);

  // ดึงข้อมูลผู้ใช้จาก backend
  const fetchUserData = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8000/api/v1/auth/myku-data/",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (res.status === 200) {
        setUserData(res.data);
      }
    } catch (error) {
      console.error(error);
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
