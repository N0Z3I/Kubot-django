import axios from "axios";
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

const Login = () => {
  const [logindata, setLoginData] = useState({
    email: "",
    password: "",
  });
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleOnChange = (e) => {
    setLoginData({ ...logindata, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = logindata;
    if (!email || !password) {
      setError("Email and password are required");
    } else {
      setIsLoading(true);
      try {
        const res = await axios.post(
          "http://localhost:8000/api/v1/auth/login/",
          logindata
        );
        const response = res.data;
        console.log(response);
        setIsLoading(false);

        const user = {
          email: response.email,
          names: response.full_name,
        };

        if (res.status === 200) {
          Cookies.set("user", JSON.stringify(user));
          Cookies.set("access", response.access_token);
          Cookies.set("refresh", response.refresh_token);
          toast.success("Login successful");
          setTimeout(() => {
            navigate("/dashboard");
            window.location.reload(); // Refresh the page after navigating
          }, 1000);
        }
      } catch (error) {
        setIsLoading(false);
        setError("Login failed. Please try again.");
        toast.error("Login failed. Please try again.");
      }
    }
  };

  return (
    <div>
      <div className="form-container">
        <div style={{ width: "30%" }} name="wrapper">
          <h2>Login</h2>
          <form onSubmit={handleSubmit}>
            {isLoading && <p>Loading...</p>}
            <div className="form-group">
              <label>Email address</label>
              <input
                type="text"
                className="email-form"
                name="email"
                value={logindata.email}
                onChange={handleOnChange}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="email-form"
                name="password"
                value={logindata.password}
                onChange={handleOnChange}
              />
            </div>
            <input type="submit" value="Login" className="submitButton" />
            <p className="pass-link">
              <Link to={"/forget_password"}>Forgot password?</Link>
            </p>
            <p className="pass-link">
              <Link to={"/signup"}>Create account</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
