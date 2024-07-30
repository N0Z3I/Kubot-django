import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const KuLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post("http://localhost:8000/api/v1/login/", {
        username,
        password,
      });
      setData(response.data);
      toast.success("Login successful!");
    } catch (error) {
      console.error("Login failed:", error);
      toast.error("Login failed!");
      setError("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>Login</h1>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin} disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>
      {error && <div className="error">{error}</div>}
      {data && (
        <div>
          <h2>Student Data</h2>
          <pre>{JSON.stringify(data.studentData, null, 2)}</pre>
          <h2>Schedule</h2>
          <pre>{JSON.stringify(data.schedule, null, 2)}</pre>
          <h2>Grades</h2>
          <pre>{JSON.stringify(data.grades, null, 2)}</pre>
          <h2>GPAX</h2>
          <pre>{data.gpax}</pre>
        </div>
      )}
    </div>
  );
};

export default KuLogin;
