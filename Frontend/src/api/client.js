import axios from 'axios';

// Vite uses import.meta.env to access environment variables
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const API_KEY = import.meta.env.VITE_API_KEY || ''; 

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Research-API-Key': API_KEY
  },
});

// A global interceptor to catch those 422 or 500 fatal errors we built in the backend
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if the error is our custom FastAPI backend error format
    if (error.response && error.response.data && error.response.data.http_status_code) {
      const backendError = error.response.data;
      
      console.error(`[FATAL BACKEND ERROR ${backendError.http_status_code}]:`, backendError.error_message);
      
      if (backendError.details) {
        console.error("[Validation Details]:", backendError.details);
      }

      // Attach the clean backend error directly to the promise rejection
      // so the UI can easily display: error.customData.error_message
      error.isCustomBackendError = true;
      error.customData = backendError;
    } else {
      console.error("[Network/Unknown API Error]:", error.message);
    }
    
    return Promise.reject(error);
  }
);