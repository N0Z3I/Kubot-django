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
        const res = await axios.post(url, formData);
        const response = res.data;
        console.log(response);
        setIsLoading(false);

        if (res.status === 200 || res.status === 201) {
          const user = {
            email: response.email,
            names: response.full_name,
          };

          Cookies.set("user", JSON.stringify(user));
          Cookies.set("access", response.access_token);
          Cookies.set("refresh", response.refresh_token);
          toast.success("Operation successful");

          setTimeout(() => {
            navigate("/student_dashboard");
            window.location.reload(); // Refresh the page after navigating
          }, 1000);
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
          <h2>{isRegistering ? "myKu Login" : "Login"}</h2>
          <form onSubmit={handleSubmit}>
            {isLoading && <p>Loading...</p>}
            {error && <p className="error-message">{error}</p>}
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                className="email-form"
                name="username"
                value={formData.username}
                onChange={handleOnChange}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="email-form"
                name="password"
                value={formData.password}
                onChange={handleOnChange}
              />
            </div>
            <input
              type="submit"
              value={isRegistering ? "Register" : "Login"}
              className="submitButton"
            />
            <p className="pass-link">
              <Link to={"/forget_password"}>Forgot password?</Link>
            </p>
            <p className="pass-link">
              <Link to={isRegistering ? "/login" : "/signup"}>
                {isRegistering
                  ? "Already have an account? Login"
                  : "Create account"}
              </Link>
            </p>
            <p className="pass-link">
              <Link to={"/ku_signup"}>myKU</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterAndLoginStudent;
