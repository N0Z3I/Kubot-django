import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import {
  Signup,
  Login,
  Profile,
  VerifyEmail,
  ForgetPassword,
} from "./components";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Profile />} />
          <Route path="/otp/verify" element={<VerifyEmail />} />
          <Route path="/forget-password" element={<ForgetPassword />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
