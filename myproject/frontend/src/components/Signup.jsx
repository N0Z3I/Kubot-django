import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

const Signup = () => {
  const navigate = useNavigate();
  const [formdata, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    password2: "",
  });

  const [error, setError] = useState("");

  const handleOnChange = (e) => {
    setFormData({ ...formdata, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, first_name, last_name, password, password2 } = formdata;
    if (!email || !first_name || !last_name || !password || !password2) {
      setError("Please fill all the fields");
      return;
    } else {
      console.log(formdata);
      const res = await axios.post(
        "http://localhost:8000/api/v1/auth/register/",
        formdata
      );
      const response = res.data;
      console.log(response);
      if (res.status === 201) {
        navigate("/otp/verify");
        toast.success(response.message);
      }
    }
  };

  const { email, first_name, last_name, password, password2 } = formdata;
  return (
    <div>
      <div className="form-container">
        <div style={{ width: "30%" }} className="wrapper">
          <form onSubmit={handleSubmit}>
            <p style={{ color: "red", padding: "1px" }}>{error ? error : ""}</p>
            <div className="form-group">
              <h4>Sign Up</h4>
              <input
                placeholder="Email"
                type="text"
                className="email-form"
                name="email"
                value={email}
                onChange={handleOnChange}
              />
            </div>
            <div className="form-group">
              <input
                placeholder="First Name"
                type="text"
                className="email-form"
                name="first_name"
                value={first_name}
                onChange={handleOnChange}
              />
            </div>
            <div className="form-group">
              <input
                placeholder="Last Name"
                type="text"
                className="email-form"
                name="last_name"
                value={last_name}
                onChange={handleOnChange}
              />
            </div>
            <div className="form-group">
              <input
                placeholder="Password"
                type="password"
                className="email-form"
                name="password"
                value={password}
                onChange={handleOnChange}
              />
            </div>
            <div className="form-group">
              <input
                placeholder="Confirm Password"
                type="password"
                className="email-form"
                name="password2"
                value={password2}
                onChange={handleOnChange}
              />
            </div>
            <input type="submit" value="Sign Up" className="submitButton" />
            <p1 className="pass-link">
              Already have an account? <Link to={"/login"}>Login here</Link>
            </p1>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
