import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { toast } from "react-toastify";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { uid, token } = useParams();
  const [newPasswords, setNewPasswords] = useState({
    password: "",
    confirm_password: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setNewPasswords({ ...newPasswords, [e.target.name]: e.target.value });
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumber &&
      hasSpecialChar
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePassword(newPasswords.password)) {
      setError(
        "Password must be at least 8 characters long and include uppercase letters, lowercase letters, numbers, and special characters"
      );
      return;
    }

    if (newPasswords.password !== newPasswords.confirm_password) {
      setError("Passwords do not match");
      return;
    }

    const data = {
      password: newPasswords.password,
      confirm_password: newPasswords.confirm_password,
      uidb64: uid,
      token: token,
    };

    try {
      const response = await axiosInstance.patch("/auth/set-new-password/", data);
      const result = response.data;
      if (response.status === 200) {
        navigate("/login");
        toast.success(result.message);
      }
      console.log(response);
    } catch (error) {
      setError("An error occurred while resetting your password");
      console.error(error);
    }
  };

  return (
    <div>
      <div className="form-container">
        <div className="wrapper" style={{ width: "100%" }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <h4>Enter your New Password</h4>
              <input
                placeholder="New Password"
                type="password"
                className="email-form"
                name="password"
                value={newPasswords.password}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <input
                placeholder="Confirm Password"
                type="password"
                className="email-form"
                name="confirm_password"
                value={newPasswords.confirm_password}
                onChange={handleChange}
              />
            </div>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <button type="submit" className="vbtn">
              Set New Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
