// Shared HTTP client for the Driver application.
import axios from "axios";

const AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8001",
});

let tokenExpiredHandler: () => void = () => {};

export const setTokenExpiredHandler = (handler: () => void) => {
  tokenExpiredHandler = handler;
};

AxiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("driver_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

AxiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";
    const isLoginRequest = url.includes("/driver/login");

    if (status === 401 && !isLoginRequest) {
      tokenExpiredHandler();
    }

    return Promise.reject(error);
  },
);

export default AxiosInstance;
