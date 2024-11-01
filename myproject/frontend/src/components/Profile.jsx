import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null); // จัดการข้อมูลผู้ใช้ใน State
  const jwt_access = Cookies.get("access");
  const refresh = Cookies.get("refresh");
  const [discordProfile, setDiscordProfile] = useState(null);

  useEffect(() => {
    if (jwt_access) {
      getSomeData();
    }
  }, []);

  const getSomeData = async () => {
    try {
      const resp = await axiosInstance.get("/auth/profile/");
      if (resp.status === 200) {
        console.log(resp.data);
        setUser(resp.data);
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
        setUser(null);
        navigate("/login");
        toast.success("Logout successful");
      }
    } catch (error) {
      console.error(error);
      toast.error("Logout failed. Please try again.");
    }
  };

  return (
    <div>
      <header>
        <h5 className="logo"></h5>
        <nav className="navigation">
          {jwt_access ? (
            <>
              <button
                onClick={() => navigate("/connections")}
                className="connections-btn"
              >
                Connections
              </button>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </>
          ) : (
            <button onClick={() => navigate("/login")} className="login-btn">
              Login
            </button>
          )}
        </nav>
      </header>
      <section id="hero">
        <div className="container">
          <h1>
            The only Discord app
            <br />
            you'll ever need! <br></br>
            <p>KuBot is the easiest way to organize your studies.</p>
            <a
              href="https://discord.com/oauth2/authorize?client_id=1295415714144059405&permissions=8&integration_type=0&scope=bot"
              target="_blank"
              rel="noopener noreferrer"
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
