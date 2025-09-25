import axios from "axios";
import { telemetry } from "../services/appInsights";

// Use environment variable for API URL, fallback to production
const API_BASE_URL = process.env.REACT_APP_API_URL || "https://smart-expense-tracker-app.azurewebsites.net/api";

const API = axios.create({ 
  baseURL: API_BASE_URL,
  timeout: 10000 // 10 second timeout
});

// attach token if available and track requests
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  
  // Track API requests
  telemetry.trackEvent('api_request', {
    method: req.method?.toUpperCase(),
    url: req.url,
    baseURL: req.baseURL,
    hasAuth: !!token
  });
  
  return req;
});

// Handle response errors globally and track them
API.interceptors.response.use(
  (response) => {
    // Track successful API responses
    telemetry.trackEvent('api_response_success', {
      method: response.config.method?.toUpperCase(),
      url: response.config.url,
      status: response.status
    });
    return response;
  },
  (error) => {
    // Track API errors
    telemetry.trackException(error, {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      status: error.response?.status,
      errorCode: error.code,
      message: error.message
    });
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      telemetry.trackEvent('token_expired');
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
