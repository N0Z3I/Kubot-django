import axios from "axios";
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

const LinkMyku = () => {
  const [mykuData, setMykuData] = useState({
    username: "",
    password: "",
  });
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleOnChange = (e) => {
    setMykuData({ ...mykuData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, password } = mykuData;
    if (!username || !password) {
      setError("Username และ Password เป็นข้อมูลที่จำเป็น");
      toast.error("กรุณากรอกข้อมูลให้ครบ");
    } else {
      setIsLoading(true);
      try {
        const res = await axios.post(
          "http://localhost:8000/api/v1/auth/myku-login/",
          mykuData
        );
        const response = res.data;
        console.log(response);
        setIsLoading(false);

        if (res.status === 200) {
          toast.success("เชื่อม MyKU สำเร็จ");
          navigate("/dashboard");
        }
      } catch (error) {
        setIsLoading(false);
        setError("เชื่อม MyKU ไม่สำเร็จ");
        toast.error("การเชื่อม MyKU ไม่สำเร็จ กรุณาลองใหม่");
      }
    }
  };

  return (
    <div>
      <div className="form-container">
      <div style={{ width: "30%" }} name="wrapper">
      <form onSubmit={handleSubmit}>
      <h4>Link account MyKU</h4>
        <input
          type="text"
          name="username"
          value={mykuData.username}
          onChange={handleOnChange}
          placeholder="MyKU Username"
        />
        <input
          type="password"
          name="password"
          value={mykuData.password}
          onChange={handleOnChange}
          placeholder="MyKU Password"
        />
        <button type="submit" className="submitButton" disabled={isLoading}>
          {isLoading ? "กำลังเชื่อม..." : "Link account MyKU"}
        </button>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <br />
            <p1 className="pass-link">
              Sign in with email account <Link to={"/Login"}>Login here</Link>
            </p1>
            <br />
      </form>
    </div>
    </div>
    </div>
  );
};

export default LinkMyku;
