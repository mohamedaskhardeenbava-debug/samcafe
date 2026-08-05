import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_SERVER_URL || "http://localhost:4000",
  withCredentials: true, // required so the httpOnly customer session cookie (samcafe_uid) is sent/received
});

export default api;

//------------------------------------user panel---------------------------------------------