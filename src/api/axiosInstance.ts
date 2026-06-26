import axios from "axios";

// Since frontend and backend run on the same port 3000, we can use a relative base path
// or fallback to the injected APP_URL / local development port.
const getBaseURL = () => {
  const envUrl = (import.meta as any).env.VITE_API_BASE_URL;
  if (envUrl) return `${envUrl}/api`;
  return "/api";
};

const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  }
});

// Request interceptor to inject Authorization header if token exists in localStorage
axiosInstance.interceptors.request.use(
  (config) => {
    const urlStr = config.url || "";
    const isAdminRoute = urlStr.startsWith("/admin") || urlStr.includes("admin/") || urlStr.includes("/admin");
    const token = isAdminRoute
      ? (localStorage.getItem("admin_token") || localStorage.getItem("token"))
      : localStorage.getItem("token");
      
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Axios interceptor to catch 401 Unauthorized errors and force logout
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized API access - removing active local storage tokens.");
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("token_active");
      localStorage.removeItem("admin_token");
      // Optionally redirect or dispatch logout on the store
      if (typeof window !== "undefined" && !window.location.pathname.includes("/auth") && !window.location.pathname.includes("/admin")) {
        window.location.href = "/auth";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
