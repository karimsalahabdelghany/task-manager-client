// src/services/api.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5203/API" 
});

// Add token automatically to every request
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;
