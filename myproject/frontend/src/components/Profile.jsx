import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

const Profile = () => {
  const navigate = useNavigate();
  const user = JSON.parse(Cookies.get("user"));
  const jwt_access = Cookies.get("access");

  useEffect(() => {
    if (!jwt_access || !user) {
      navigate("/login");
    } else {
      getSomeData();
    }
  }, [jwt_access, user]);

  const refresh = Cookies.get("refresh");

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

  return (
    <div>
      <section id="hero">
        <div className="container">
          <h1>
            The only Discord app
            <br />
            you'll ever need!
            <p>KuBot is the easiest way to organize your studies.</p>
            <a
              href="https://discord.com/oauth2/authorize?client_id=1245512193500381205&permissions=8&scope=bot"
              target="_blank"
            >
              <button className="hover">Add to discord</button>
            </a>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </h1>
        </div>
      </section>

      <section id="features">
        <div className="container">
          <h1>Features</h1>
        </div>
      </section>

      <section id="about">
        <div className="container">
          <h1>Commands</h1>
        </div>
      </section>

      <section id="addbot">
        <div className="container">
          <h3>
            Add KuBot
            <p>Start upgrading your Discord server today!</p>
            <a href="https://discord.com/oauth2/authorize?client_id=1245512193500381205&permissions=8&scope=bot">
              <button className="hover">Add to discord</button>
            </a>
          </h3>
        </div>
      </section>

      <footer>
        <p>Copyright © 2024 KU BOT. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Profile;
