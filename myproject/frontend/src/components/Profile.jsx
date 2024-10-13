import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import axiosInstance from "../utils/axiosInstance";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null); // จัดการข้อมูลผู้ใช้ใน State
  const jwt_access = Cookies.get("access");
  const refresh = Cookies.get("refresh");

  // เช็คว่ามี user และ jwt_access หรือไม่ (และป้องกันการวนลูป)
  useEffect(() => {
    const storedUser = Cookies.get("user");
    if (!jwt_access || !storedUser) {
      navigate("/login");
    } else {
      setUser(JSON.parse(storedUser)); // ตั้งค่า user เมื่อมีข้อมูลจาก cookies
    }
  }, []); // [] ทำให้ useEffect นี้ทำงานแค่ครั้งเดียวตอน mount

  // แยกการเช็ค Discord Auth Code ออกมาใน useEffect อีกตัว
  useEffect(() => {
    checkDiscordAuthCode(); // เรียกเช็คว่ามี Discord authorization code หรือไม่
  }, []); // [] ทำให้ฟังก์ชันนี้ทำงานแค่ครั้งเดียวเช่นกัน

  const checkDiscordAuthCode = () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      fetchDiscordData(code); // ถ้าเจอ code ให้ส่งไป backend
    }
  };

  const getSomeData = async () => {
    try {
      const resp = await axiosInstance.get("/auth/profile/");
      if (resp.status === 200) {
        console.log(resp.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await axiosInstance.post("/auth/logout/", {
        refresh_token: refresh,
      });
      if (res.status === 200) {
        Cookies.remove("access");
        Cookies.remove("refresh");
        Cookies.remove("user");
        navigate("/login");
        toast.success("Logout successful");
      }
    } catch (error) {
      console.error(error);
      toast.error("Logout failed. Please try again.");
    }
  };

  // ฟังก์ชันสำหรับเชื่อมต่อ Discord
  const handleDiscordConnect = () => {
    const discordAuthURL = `https://discord.com/api/oauth2/authorize?client_id=1292933694511775847&redirect_uri=http://localhost:8000/api/v1/auth/discord/callback/&response_type=code&scope=identify`;
    window.location.href = discordAuthURL;
  };

  // ฟังก์ชันที่เรียก backend เพื่อเชื่อมต่อกับ Discord
  const fetchDiscordData = async (code) => {
    const accessToken = Cookies.get("access"); // ตรวจสอบ access token
    if (code && accessToken) {
      try {
        const res = await axios.post(
          "http://localhost:8000/api/v1/auth/discord/connect/",
          { code: code }, // ส่ง authorization code ที่ได้จาก Discord
          {
            headers: {
              Authorization: `Bearer ${accessToken}`, // ตั้ง Authorization header ให้ถูกต้อง
            },
          }
        );

        if (res.status === 200) {
          toast.success("เชื่อมต่อ Discord สำเร็จ!");
          navigate("/profile");
        }
      } catch (error) {
        console.error(
          "Error connecting to Discord:",
          error.response ? error.response.data : error.message
        );
        toast.error("เชื่อมต่อ Discord ไม่สำเร็จ กรุณาลองใหม่");
      }
    } else {
      toast.error("Access token not found");
    }
  };

  return (
    <div>
      <header>
        <h5 className="logo"></h5>
        <nav className="navigation">
          <button onClick={handleDiscordConnect} className="logindiscord-btn">
            Link with Discord
          </button>
          <a href="/link-myku">
            <button className="loginmyku-btn">Link with Nontri account</button>
          </a>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </nav>
      </header>
      <section id="hero">
        <div className="container">
          <h1>
            The only Discord app
            <br />
            you'll ever need!
            <p>KuBot is the easiest way to organize your studies.</p>
            <a
              href="https://discord.com/oauth2/authorize?client_id=1292933694511775847&permissions=8&scope=bot"
              target="_blank"
            >
              <button className="hover">Add to discord</button>
            </a>
          </h1>
          <img src="/favicon.png" alt="" />
        </div>
      </section>
    </div>
  );
};

export default Profile;
