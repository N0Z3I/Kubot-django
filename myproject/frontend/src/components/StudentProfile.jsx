import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

const StudentProfile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [responseData, setResponseData] = useState(location.state);

  useEffect(() => {
    if (!responseData) {
      const userFromCookies = Cookies.get("user");
      if (userFromCookies) {
        setResponseData(JSON.parse(userFromCookies));
      } else {
        navigate("/ku_signup");
      }
    }
  }, [responseData, navigate]);

  const handleLogout = () => {
    Cookies.remove("user");
    Cookies.remove("access");
    Cookies.remove("refresh");
    navigate("/ku_signup");
    toast.success("Logout successful");
  };

  if (!responseData) {
    return <div>Loading...</div>;
  }

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
              rel="noopener noreferrer"
            >
              <button className="hover">Add to discord</button>
            </a>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </h1>
        </div>
      </section>

      <section id="profile-information">
        <div className="container">
          <h1>Profile Information</h1>
          <div>
            <h2>Basic Information</h2>
            <p>Username: {responseData.user.username}</p>
            <p>ID: {responseData.user.id}</p>
            <p>Full Name: {responseData.user.full_name}</p>
            <p>Email: {responseData.user.email}</p>
            <h2>Full Response Data</h2>
            <pre>{JSON.stringify(responseData, null, 2)}</pre>
          </div>
        </div>
      </section>

      <section id="features">
        <div className="container">
          <h1>Features</h1>
          <div></div>
        </div>
      </section>

      <section id="about">
        <div className="container">
          <h1>Commands</h1>
          <div></div>
        </div>
      </section>

      <section id="addbot">
        <div className="container">
          <h3>
            Add KuBot
            <p>Start upgrading your Discord server today!</p>
            <a
              href="https://discord.com/oauth2/authorize?client_id=1245512193500381205&permissions=8&scope=bot"
              target="_blank"
              rel="noopener noreferrer"
            >
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

export default StudentProfile;
