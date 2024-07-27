import axios from "axios";
import { jwtDecode } from "jwt-decode";
import dayjs from "dayjs";
import Cookies from "js-cookie";

const token = Cookies.get("access") ? JSON.parse(Cookies.get("access")) : "";
const refresh_token = Cookies.get("refresh")
  ? JSON.parse(Cookies.get("refresh"))
  : "";

const baseUrl = "http://localhost:8000/api/v1";
const axiosInstance = axios.create({
  baseURL: baseUrl,
  "Content-type": "application/json",
  headers: {
    Authorization: Cookies.get("access") ? `Bearer ${token}` : null,
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
      const res = await axios.post(`${baseUrl}/auth/token/refresh/`, {
        refresh: refresh_token,
      });
      console.log(res.data);
      if (res.status === 200) {
        Cookies.set("access", JSON.stringify(res.data.access));
        req.headers.Authorization = `Bearer ${res.data.access}`;
        return req;
      } else {
        const res = await axios.post(`${baseUrl}/auth/logout/`, {
          refresh_token: refresh,
        });
        if (res.status === 200) {
          Cookies.remove("access");
          Cookies.remove("refresh");
          Cookies.remove("user");
        }
      }
    }
  }
  return req;
});

console.log("axiosInstance: ");
export default axiosInstance;
