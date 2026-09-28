// Configurable API base URL for deployment environments (Vercel frontend -> Render backend)
const envApiUrl = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_URL : undefined;
const BASE_URL = (envApiUrl || 'http://localhost:5000').replace(/\/$/, '');

export const API_BASE_URL = BASE_URL;

/**
 * Constructs full API URL by prepending the configurable VITE_API_URL base path.
 * @param {string} endpoint - Relative API endpoint path (e.g., '/api/deals')
 * @returns {string} Full API URL string
 */
export const getApiUrl = (endpoint) => {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${BASE_URL}${path}`;
};
