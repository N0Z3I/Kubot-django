import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

const Connections = () => {
  const [activeTab, setActiveTab] = useState("nontri");
  const [discordProfile, setDiscordProfile] = useState(
    JSON.parse(localStorage.getItem("discordProfile")) || null
  );
  const [isLinkingKu, setIsLinkingKu] = useState(false);
  const [mykuData, setMykuData] = useState({ username: "", password: "" });
  const [studentProfile, setStudentProfile] = useState(
    JSON.parse(localStorage.getItem("studentProfile")) || null
  );
  const navigate = useNavigate();

  const handleOnChange = (e) => {
    setMykuData({ ...mykuData, [e.target.name]: e.target.value });
  };

  const handleMykuSubmit = async (e) => {
    e.preventDefault();
    try {
      const accessToken = Cookies.get("access");
      if (!accessToken)
        throw new Error("Session expired. Please log in again.");

      const res = await axiosInstance.post("/auth/myku-login/", mykuData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.status === 200) {
        toast.success("MyKU connection successful!");
        fetchStudentData();
        setIsLinkingKu(false);
      }
    } catch (error) {
      toast.error("Failed to connect MyKU. Please try again.");
    }
  };

  const fetchStudentData = async () => {
    try {
      const res = await axiosInstance.get("/auth/myku-data/");
      if (res.status === 200) {
        setStudentProfile(res.data.student_profile);
        localStorage.setItem(
          "studentProfile",
          JSON.stringify(res.data.student_profile)
        );
      }
    } catch (error) {
      toast.error("Unable to fetch student data.");
    }
  };

  const handleKuLogout = async () => {
    try {
      await axiosInstance.delete("/auth/delete-myku-data/");
      toast.success("Your data has been deleted successfully.");
      setStudentProfile(null);
      localStorage.removeItem("studentProfile");
    } catch (error) {
      toast.error("Failed to delete your data.");
    }
  };

  const handleDiscordConnect = () => {
    const token = Cookies.get("access");
    const discordAuthURL = `https://discord.com/api/oauth2/authorize?client_id=1292933694511775847&redirect_uri=http://localhost:8000/api/v1/auth/discord/callback/&response_type=code&scope=identify%20email&state=${token}`;
    window.location.href = discordAuthURL;
  };

  const getDiscordProfile = async () => {
    try {
      const response = await axiosInstance.get("/auth/discord/profile/");
      if (response.status === 200) {
        setDiscordProfile(response.data);
        localStorage.setItem("discordProfile", JSON.stringify(response.data));
      }
    } catch {
      setDiscordProfile(null);
      localStorage.removeItem("discordProfile");
    }
  };

  const handleDiscordLogout = async () => {
    try {
      const accessToken = Cookies.get("access");
      await axiosInstance.post(
        "/auth/discord/logout/",
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setDiscordProfile(null);
      localStorage.removeItem("discordProfile");
      toast.success("Disconnected from Discord.");
    } catch {
      toast.error("Failed to disconnect Discord.");
    }
  };

  useEffect(() => {
    // ถ้าไม่มีข้อมูลใน localStorage จะเรียกข้อมูลจาก API ใหม่
    if (!discordProfile) getDiscordProfile();
    if (!studentProfile && !isLinkingKu) fetchStudentData();
  }, []);

  return (
    <div className="container mt-5">
      <h1>Connection Center</h1>
      <div className="tabs-vertical">
        <button
          className={`tab-btn ${activeTab === "nontri" ? "active" : ""}`}
          onClick={() => setActiveTab("nontri")}
        >
          Nontri
        </button>
        <button
          className={`tab-btn ${activeTab === "discord" ? "active" : ""}`}
          onClick={() => setActiveTab("discord")}
        >
          Discord
        </button>
      </div>

      <div className="tab-content mt-4">
        {activeTab === "nontri" ? (
          <div>
            <h2>Nontri Account</h2>
            {studentProfile ? (
              <div>
                <p>
                  <strong>Name (TH):</strong> {studentProfile.name_th}
                </p>
                <p>
                  <strong>Name (EN):</strong> {studentProfile.name_en}
                </p>
                <p>
                  <strong>Student ID:</strong> {studentProfile.std_code}
                </p>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="btn btn-primary me-2"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={handleKuLogout}
                  className="btn btn-danger mt-3"
                >
                  Logout
                </button>
              </div>
            ) : isLinkingKu ? (
              <form onSubmit={handleMykuSubmit} className="mt-4">
                <div className="form-group">
                  <input
                    type="text"
                    name="username"
                    value={mykuData.username}
                    onChange={handleOnChange}
                    placeholder="MyKU Username"
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="password"
                    name="password"
                    value={mykuData.password}
                    onChange={handleOnChange}
                    placeholder="MyKU Password"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-success">
                  Link Account
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsLinkingKu(true)}
                className="btn btn-primary"
              >
                Link Nontri Account
              </button>
            )}
          </div>
        ) : (
          <div>
            <h2>Discord Profile</h2>
            {discordProfile ? (
              <div className="profile-content">
                <img
                  src={discordProfile.avatar_url}
                  alt="Discord Avatar"
                  className="profile-avatar"
                />
                <p>
                  <strong>Username:</strong> {discordProfile.discord_username}
                </p>
                <button
                  onClick={handleDiscordLogout}
                  className="btn btn-danger"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={handleDiscordConnect}
                className="btn btn-primary"
              >
                Connect to Discord
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Connections;
