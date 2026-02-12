import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000",
  headers: {
    "Content-Type": "application/json"
  }
});

export default api;

// import axios from "axios";

// const api = axios.create({
//   baseURL: "https://samcafedata.onrender.com"
// });

// export default api;
