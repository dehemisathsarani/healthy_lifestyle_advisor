import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api", // replace with your backend URL
});

export default api;
