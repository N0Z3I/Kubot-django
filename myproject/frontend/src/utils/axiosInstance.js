import axios from "axios";
import { jwtDecode } from "jwt-decode";
import dayjs from "dayjs";
import Cookies from "js-cookie";

const baseUrl = "http://localhost:8000/api/v1";
const axiosInstance = axios.create({
  baseURL: baseUrl,
  "Content-type": "application/json",
});

axiosInstance.interceptors.request.use(async (req) => {
  let token = Cookies.get("access");
  const refresh_token = Cookies.get("refresh");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
    console.log("Authorization Token Set:", req.headers.Authorization); // สำหรับตรวจสอบ

    const decodedToken = jwtDecode(token);
    const isExpired = dayjs.unix(decodedToken.exp).diff(dayjs()) < 1;

    if (isExpired) {
      try {
        const res = await axios.post(`${baseUrl}/auth/token/refresh/`, {
          refresh: refresh_token,
        });

        if (res.status === 200) {
          Cookies.set("access", res.data.access, { expires: 1 });
          req.headers.Authorization = `Bearer ${res.data.access}`;
          console.log("Token Refreshed and Set:", req.headers.Authorization);
        } else {
          await handleLogout();
        }
      } catch (error) {
        await handleLogout();
      }
    }
  } else {
    console.warn("No Access Token Found");
  }

  return req;
});

const handleLogout = async () => {
  Cookies.remove("access");
  Cookies.remove("refresh");
  Cookies.remove("user");
  alert("Session expired. Please log in again.");
  window.location.href = "/login";
};

export default axiosInstance;
