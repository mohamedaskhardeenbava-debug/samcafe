// Vercel serverless catch-all proxy for /api/*.
//
// A plain vercel.json "rewrites" entry proxies the request body/response
// fine, but Vercel's static-rewrite layer silently drops any Set-Cookie
// header coming back from the destination — so the customer session
// cookie (samcafe_uid) issued by the Render backend never actually
// reaches the browser, even though every other part of the response
// looks correct. This function replaces that rewrite: it's a real
// request handler, so it has full control over headers and can forward
// Set-Cookie (and everything else) through untouched, while still being
// same-origin from the browser's point of view — which is the whole
// reason this proxy exists in the first place (avoids Chrome/Safari
// third-party cookie blocking on the cross-site Render domain).
//
// Requires BACKEND_ORIGIN to be set in Vercel's Environment Variables
// (Settings → Environment Variables), e.g.:
//   BACKEND_ORIGIN=https://samcafe-server-testing.onrender.com
// This is a plain (non REACT_APP_) var since it's only read server-side
// by this function, never bundled into the browser JS.

const BACKEND_ORIGIN = (process.env.BACKEND_ORIGIN || "").replace(/\/$/, "");

// Hop-by-hop headers must never be forwarded (per RFC 7230 §6.1) — Vercel's
// own runtime sets host/connection-level headers for us either way.
const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length", // recalculated by the runtime for the outgoing response
]);

module.exports = async (req, res) => {
  if (!BACKEND_ORIGIN) {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "BACKEND_ORIGIN is not configured on the server" }));
    return;
  }

  // req.url is the full incoming path as Vercel's Node runtime received it,
  // e.g. "/api/orders?venueId=..." — it does NOT get the "/api" prefix
  // stripped automatically. Strip it explicitly here so the backend
  // receives the bare resource path it actually expects (e.g. "/orders"),
  // matching what a plain vercel.json rewrite would have produced.
  const strippedUrl = req.url.replace(/^\/api(?=\/|$|\?)/, "") || "/";
  const targetUrl = `${BACKEND_ORIGIN}${strippedUrl}`;

  const outgoingHeaders = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (HOP_BY_HOP.has(key.toLowerCase())) continue;
    outgoingHeaders[key] = value;
  }

  let body;
  if (!["GET", "HEAD"].includes(req.method)) {
    // Vercel's Node runtime doesn't pre-parse the body for a raw function
    // handler, so collect the stream ourselves and forward it as-is —
    // this keeps JSON, form-data, and any other content-type intact
    // without needing to know or re-serialize the shape of the payload.
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    body = Buffer.concat(chunks);
  }

  let backendRes;
  try {
    backendRes = await fetch(targetUrl, {
      method: req.method,
      headers: outgoingHeaders,
      body,
      redirect: "manual", // let the browser handle backend redirects itself
    });
  } catch (err) {
    res.statusCode = 502;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "Upstream backend unreachable", detail: err.message }));
    return;
  }

  res.statusCode = backendRes.status;

  // getSetCookie() preserves each cookie as its own header — critical,
  // since multiple Set-Cookie values collapsed into one string (which a
  // naive res.setHeader(name, value) loop would do) breaks browser cookie
  // parsing when the backend sets more than one cookie in a response.
  for (const [key, value] of backendRes.headers.entries()) {
    if (HOP_BY_HOP.has(key.toLowerCase())) continue;
    if (key.toLowerCase() === "set-cookie") continue; // handled separately below
    res.setHeader(key, value);
  }
  const setCookieValues =
    typeof backendRes.headers.getSetCookie === "function"
      ? backendRes.headers.getSetCookie()
      : backendRes.headers.get("set-cookie")
        ? [backendRes.headers.get("set-cookie")]
        : [];
  if (setCookieValues.length) res.setHeader("set-cookie", setCookieValues);

  const responseBody = Buffer.from(await backendRes.arrayBuffer());
  res.end(responseBody);
};
