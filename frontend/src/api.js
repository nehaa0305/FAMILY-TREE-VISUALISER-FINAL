// Set up axios instance for authenticated API calls to Flask backend
// Automatically attach JWT token to headers

import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000', // Adjust if deployed
});

// Add JWT token from localStorage to headers
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;
