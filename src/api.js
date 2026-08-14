import axios from "axios";

// In production, calls go through the /api/* rewrite defined in
// vercel.json, which proxies to the Render backend server-side. This
// makes every request same-origin from the browser's point of view, so
// the customer session cookie (samcafe_uid) is never treated as
// third-party — avoiding Chrome's third-party cookie blocking (and
// Safari's ITP) regardless of the visitor's browser settings. Locally,
// Vercel's rewrite doesn't exist, so dev still talks directly to
// localhost:4000 as before.
const baseURL =
  process.env.NODE_ENV === "production"
    ? "/api"
    : process.env.REACT_APP_SERVER_URL || "http://localhost:4000";

const api = axios.create({
  baseURL,
  withCredentials: true, // required so the httpOnly customer session cookie (samcafe_uid) is sent/received
});

export default api;

//------------------------------------user panel---------------------------------------------