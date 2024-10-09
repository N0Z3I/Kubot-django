import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import axiosInstance from "../utils/axiosInstance";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

const Profile = () => {
  const navigate = useNavigate();
  const user = JSON.parse(Cookies.get("user"));
  const jwt_access = Cookies.get("access");
  const refresh = Cookies.get("refresh");
  const [authCode, setAuthCode] = useState(null); // เก็บ authorization code จาก Discord

  useEffect(() => {
    if (!jwt_access || !user) {
      navigate("/login");
    } else {
      getSomeData();
      checkDiscordAuthCode();
    }
  }, [jwt_access, user]);

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
    window.location.href = discordAuthURL; // ส่งผู้ใช้ไปยังหน้าการยืนยัน Discord
  };

  // ตรวจสอบว่ามี authorization code จาก URL หรือไม่
  const checkDiscordAuthCode = () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      setAuthCode(code);
      fetchDiscordData(code); // ส่ง authorization code ไปที่ backend
    }
  };

  // ฟังก์ชันที่เรียก backend เพื่อเชื่อมต่อกับ Discord
  const fetchDiscordData = async (code) => {
    const accessToken = Cookies.get("access"); // ดึง access token จาก cookies

    if (code && accessToken) {
      try {
        const res = await axios.post(
          "http://localhost:8000/discord/connect/",
          { code: code },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (res.status === 200) {
          toast.success("เชื่อมต่อ Discord สำเร็จ!");
          navigate("/profile"); // ไปที่หน้าโปรไฟล์หลังเชื่อมต่อสำเร็จ
        }
      } catch (error) {
        console.error(
          "Error connecting to Discord:",
          error.response ? error.response.data : error.message
        );
        toast.error("เชื่อมต่อ Discord ไม่สำเร็จ กรุณาลองใหม่");
      }
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
              href="https://discord.com/oauth2/authorize?client_id=YOUR_DISCORD_CLIENT_ID&permissions=8&scope=bot"
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
