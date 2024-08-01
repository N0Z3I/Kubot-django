import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const RegisterAndLoginStudent = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegisterAndLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:8000/api/v1/auth/register-and-login-student/",
        {
          username,
          password,
        }
      );
      if (response.data.access_token) {
        // Save the access token in localStorage or any state management library
        localStorage.setItem("access_token", response.data.access_token);
        navigate("/student_dashboard"); // Navigate to StudentProfile page
      }
    } catch (error) {
      setError("Registration or login failed. Please try again.");
    }
  };

  return (
    <form onSubmit={handleRegisterAndLogin}>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Register and Login</button>
      {error && <p>{error}</p>}
    </form>
  );
};

export default RegisterAndLoginStudent;
