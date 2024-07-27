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
    const resp = await axiosInstance.get("/auth/profile/");
    if (resp.status === 200) {
      console.log(resp.data);
    }
  };

  const handleLogout = async () => {
    const res = await axiosInstance.post("/auth/logout/", {
      refresh_token: refresh,
    });
    if (res.status === 200) {
      Cookies.remove("access");
      Cookies.remove("refresh");
      Cookies.remove("user");
      navigate("/login");
      toast.success("logout successful");
    }
  };

  return (
    <div className="container">
      <h2>hi {user && user.names}</h2>
      <p style={{ textAlign: "center" }}>welcome to your profile</p>
      <button onClick={handleLogout} className="logout-btn">
        Logout
      </button>
    </div>
  );
};

export default Profile;
