import React, { useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import { toast } from "react-toastify";

const ForgetPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (email) {
      const res = await axiosInstance.post("/auth/password-reset/", {
        email: email,
      });
      if (res.status === 200) {
        toast.success(
          "A link to reset your password has been sent to your email"
        );
        setMessage("Please check your email for the password reset link.");
      }
      console.log(res);
      setEmail("");
    }
  };

  return (
    <div>
      <h2>Enter your registered email</h2>
      <div className="wrapper">
        {message ? (
          <div>{message}</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address:</label>
              <input
                type="text"
                className="email-form"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button className="vbtn">Send</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgetPassword;
