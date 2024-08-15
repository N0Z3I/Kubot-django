import axios from "axios";
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

const RegisterAndLoginStudent = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [isRegistering, setIsRegistering] = useState(true); // Toggle between register and login
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleOnChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, password } = formData;
    if (!username || !password) {
      setError("Username and password are required");
    } else {
      setIsLoading(true);
      try {
        const url = isRegistering
          ? "http://localhost:8000/api/v1/auth/register-and-login-student/"
          : "http://localhost:8000/api/v1/auth/login/";
        const res = await axios.post(url, {
          username: formData.username,
          password: formData.password,
        });
        const response = res.data;
        console.log(response);
        setIsLoading(false);

        if (res.status === 200 || res.status === 201) {
          const user = {
            username: response.username,
            id: response.student_code,
            email: response.email,
            full_name: response.first_name_th + " " + response.last_name_th,
            schedule: response.schedule, // Add schedule data here
            group_course: response.group_course,
          };

          Cookies.set("user", JSON.stringify(user));
          Cookies.set("access", response.access_token);
          Cookies.set("refresh", response.refresh_token);
          toast.success("Operation successful");

          setTimeout(() => {
            navigate("/student_dashboard", { state: { user } }); // Pass user data to student_dashboard
          });
        }
      } catch (error) {
        setIsLoading(false);
        setError("Operation failed. Please try again.");
        toast.error("Operation failed. Please try again.");
      }
    }
  };

  return (
    <div>
      <div className="form-container">
        <div style={{ width: "30%" }} name="wrapper">
          <form onSubmit={handleSubmit}>
            {isLoading && <p>Loading...</p>}
            {error && <p className="error-message">{error}</p>}
            <div className="form-group">
            <h4>{isRegistering ? "MyKu Login" : "Login"}</h4>
              <input
                placeholder="Username"
                type="text"
                className="email-form"
                name="username"
                value={formData.username}
                onChange={handleOnChange}
              />
            </div>
            <div className="form-group">
              <input
                placeholder="Password"
                type="password"
                className="email-form"
                name="password"
                value={formData.password}
                onChange={handleOnChange}
              />
            </div>
            <input
              type="submit"
              value={isRegistering ? "Login" : "Login"}
              className="submitButton"
            />
            <p1 className="pass-link">
            Sign in with email account <Link to={"/login"}>Login here</Link>
            </p1>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterAndLoginStudent;
