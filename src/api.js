// import axios from "axios";

// const api = axios.create({
//   baseURL: "http://localhost:4000/"
// });

// export default api;



import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_SERVER_URL || "http://localhost:4000"
});

export default api;

// "db": "json-server \"E:\\Askhar\\Sam Cafe\\data\\db.json\" --port 5000 --max-body-size 50mb"