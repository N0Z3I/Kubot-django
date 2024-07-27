import axios from "axios";
import { jwtDecode } from "jwt-decode";
import dayjs from "dayjs";
import Cookies from "js-cookie";

const token = Cookies.get("access") ? Cookies.get("access") : "";
const refresh_token = Cookies.get("refresh") ? Cookies.get("refresh") : "";

const baseUrl = "http://localhost:8000/api/v1";
const axiosInstance = axios.create({
  baseURL: baseUrl,
  "Content-type": "application/json",
  headers: {
    Authorization: token ? `Bearer ${token}` : null,
  },
});

axiosInstance.interceptors.request.use(async (req) => {
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
    const user = jwtDecode(token);
    const isExpired = dayjs.unix(user.exp).diff(dayjs()) < 1;
    if (!isExpired) {
      return req;
    } else {
      try {
        const res = await axios.post(`${baseUrl}/auth/token/refresh/`, {
          refresh: refresh_token,
        });
        if (res.status === 200) {
          Cookies.set("access", res.data.access);
          req.headers.Authorization = `Bearer ${res.data.access}`;
          return req;
        } else {
          const logoutRes = await axios.post(`${baseUrl}/auth/logout/`, {
            refresh_token: refresh_token,
          });
          if (logoutRes.status === 200) {
            Cookies.remove("access");
            Cookies.remove("refresh");
            Cookies.remove("user");
          }
        }
      } catch (error) {
        console.error("Error refreshing token", error);
      }
    }
  }
  return req;
});

export default axiosInstance;
