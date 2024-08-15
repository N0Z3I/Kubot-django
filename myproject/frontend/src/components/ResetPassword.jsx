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
  const handleChange = (e) => {
    setNewPasswords({ ...newPasswords, [e.target.name]: e.target.value });
  };

  const data = {
    password: newPasswords.password,
    confirm_password: newPasswords.confirm_password,
    uidb64: uid,
    token: token,
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await axiosInstance.patch("/auth/set-new-password/", data);
    const result = response.data;
    if (response.status === 200) {
      navigate("/login");
      toast.success(result.message);
    }
    console.log(response);
  };

  return (
    <div>
      <div className="form-container">
        <div className="wrapper" style={{ width: "100%" }}>
          <form action="" onSubmit={handleSubmit}>
            <div className="form-group">
              <h4>Enter your New Password</h4>
              <input
                placeholder="New Password"
                type="text"
                className="email-form"
                name="password"
                value={newPasswords.password}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <input
                placeholder="Confirm Password"
                type="text"
                className="email-form"
                name="confirm_password"
                value={newPasswords.confirm_password}
                onChange={handleChange}
              />
            </div>
            <button type="submit" className="vbtn">
              Submit
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
