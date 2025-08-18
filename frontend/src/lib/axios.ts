import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

axiosInstance.interceptors.request.use(cfg => {
  const at = localStorage.getItem("accessToken");
  if (at) cfg.headers.Authorization = `Bearer ${at}`;
  return cfg;
});


export default axiosInstance;
