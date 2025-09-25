import axios from "axios";

// Use environment variable for API URL, fallback to production
const API_BASE_URL = process.env.REACT_APP_API_URL || "https://smart-expense-tracker-app.azurewebsites.net/api";

const API = axios.create({ 
  baseURL: API_BASE_URL,
  timeout: 10000 // 10 second timeout
});

// attach token if available
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// Handle response errors globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timeout. Please try again.';
    } else if (!error.response) {
      error.message = 'Network error. Please check your connection.';
    }
    
    return Promise.reject(error);
  }
);

export default API;
