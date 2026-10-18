import axios from "axios";
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api", withCredentials: true });
api.interceptors.response.use(r => r, error => {
  const message = error.response?.data?.message || error.message || "Something went wrong.";
  error.friendlyMessage = message;
  return Promise.reject(error);
});
export default api;
