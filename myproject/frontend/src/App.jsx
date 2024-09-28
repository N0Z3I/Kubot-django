import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import {
  Signup,
  Login,
  Profile,
  VerifyEmail,
  ForgetPassword,
  LinkMyKU,
} from "./components";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ResetPassword from "./components/ResetPassword";
import RegisterAndLoginStudent from "./components/RegisterAndLoginStudent";
import StudentProfile from "./components/StudentProfile";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <Router>
        <ToastContainer />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/link-myku" element={<LinkMyKU />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Profile />} />
          <Route path="/otp/verify" element={<VerifyEmail />} />
          <Route path="/forget_password" element={<ForgetPassword />} />
          <Route path="/ku_signup" element={<RegisterAndLoginStudent />} />
          <Route
            path="/password-reset-confirm/:uid/:token"
            element={<ResetPassword />}
          />
          <Route path="/student_dashboard" element={<StudentProfile />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
