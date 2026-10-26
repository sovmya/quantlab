import axios from "axios";

// Relative base URL: works in dev (Vite proxy) and prod (Vercel rewrite).
const api = axios.create({ baseURL: "/api", withCredentials: true });

export const errorMessage = (err, fallback = "Something went wrong") =>
  err.response?.data?.message || fallback;

export default api;