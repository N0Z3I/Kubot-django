import axios from "axios";
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const OTP_EXPIRATION_TIME = 600; // 10 นาที (600 วินาที)
const COOLDOWN_TIME = 300; // 5 นาที (300 วินาที)

const VerifyEmail = () => {
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(OTP_EXPIRATION_TIME);
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      toast.error("No email provided. Redirecting to signup...");
      navigate("/signup");
      return;
    }

    const otpExpiration = localStorage.getItem("otpExpiration");
    const cooldownEnd = localStorage.getItem("cooldownEnd");

    const now = Math.floor(Date.now() / 1000);

    // ตรวจสอบและอัปเดตเวลา OTP
    if (otpExpiration) {
      const remainingTime = parseInt(otpExpiration) - now;
      setTimer(Math.max(remainingTime, 0));
    }

    // ตรวจสอบและอัปเดตเวลา Cooldown
    if (cooldownEnd) {
      const remainingCooldown = parseInt(cooldownEnd) - now;
      setCooldown(Math.max(remainingCooldown, 0));
    }
  }, [email, navigate]);

  // นับถอยหลัง OTP
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // นับถอยหลังคูลดาวน์
  useEffect(() => {
    if (cooldown > 0) {
      const interval = setInterval(() => setCooldown((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [cooldown]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp) {
      try {
        const response = await axios.post(
          "http://localhost:8000/api/v1/auth/verify-email/",
          { otp }
        );
        if (response.status === 200) {
          toast.success(response.data.message);
          navigate("/login");
        }
      } catch (err) {
        toast.error("Invalid OTP. Please try again.");
      }
    }
  };

  const handleResendOtp = async () => {
    try {
      await axios.post("http://localhost:8000/api/v1/auth/resend-otp/", {
        email,
      });
      toast.success("OTP has been resent!");

      const now = Math.floor(Date.now() / 1000);
      localStorage.setItem("otpExpiration", now + OTP_EXPIRATION_TIME);
      localStorage.setItem("cooldownEnd", now + COOLDOWN_TIME);

      setTimer(OTP_EXPIRATION_TIME); // รีเซ็ตเวลา OTP
      setCooldown(COOLDOWN_TIME); // เริ่มคูลดาวน์ใหม่
    } catch (err) {
      toast.error("Failed to resend OTP. Please try again.");
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <h4>Please enter your One-Time Password to verify your account</h4>
          <input
            placeholder="Enter your OTP code"
            type="text"
            className="email-form"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
        </div>
        <input type="submit" className="vbtn" value="Validate" />
        <button
          className="resend-button"
          onClick={handleResendOtp}
          disabled={cooldown > 0}
        >
          Resend One-Time Password
        </button>
        {cooldown > 0 && <p>Resend available in: {formatTime(cooldown)}</p>}
        <p>OTP will expire in: {formatTime(timer)} minutes</p>
      </form>
    </div>
  );
};

export default VerifyEmail;
