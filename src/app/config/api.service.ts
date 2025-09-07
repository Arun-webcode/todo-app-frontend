import axios from "axios";
import { environment } from "src/environments/environment";

const api = axios.create({
  baseURL: environment.baseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

export default api;
