import axios from 'axios';

// ── Cloud URL map ──────────────────────────────────────────────────
// Each key matches the value stored in the Cloud Provider dropdown.
export const CLOUD_URLS = {
  aws:    import.meta.env.VITE_AWS_URL    || '',
  azure:  import.meta.env.VITE_AZURE_URL  || '',
  render: import.meta.env.VITE_RENDER_URL || '',
  vercel: import.meta.env.VITE_VERCEL_URL || '',
};

const API_KEY = import.meta.env.VITE_API_KEY || '';

// ── Instance cache (one axios instance per cloud) ──────────────────
const clientCache = {};

/**
 * Returns a cached axios instance whose baseURL points at the chosen cloud.
 * @param {'aws'|'azure'|'render'|'vercel'} cloudKey
 */
export const getApiClient = (cloudKey = 'aws') => {
  if (clientCache[cloudKey]) return clientCache[cloudKey];

  const baseURL = CLOUD_URLS[cloudKey];
  if (!baseURL) {
    console.warn(`[API Client] No URL configured for cloud "${cloudKey}". Requests will fail.`);
  }

  const instance = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      'X-Research-API-Key': API_KEY,
    },
  });

  // Shared error interceptor (same logic as before)
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.data && error.response.data.http_status_code) {
        const backendError = error.response.data;
        console.error(`[FATAL BACKEND ERROR ${backendError.http_status_code}]:`, backendError.error_message);
        if (backendError.details) {
          console.error("[Validation Details]:", backendError.details);
        }
        error.isCustomBackendError = true;
        error.customData = backendError;
      } else {
        console.error("[Network/Unknown API Error]:", error.message);
      }
      return Promise.reject(error);
    }
  );

  clientCache[cloudKey] = instance;
  return instance;
};