const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const { isProd, PORT, APP_ORIGIN } = require("./src/config");
const { rejectUnsafeInput } = require("./src/utils/sanitize");

const app = express();
const { conDB } = require("./src/dbconnection");

app.disable("x-powered-by");
app.set("trust proxy", isProd ? 1 : false);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
        scriptSrc: ["'self'"],
        scriptSrcAttr: ["'none'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        mediaSrc: ["'none'"],
        frameSrc: ["'none'"],
        ...(isProd ? { upgradeInsecureRequests: [] } : { upgradeInsecureRequests: null }),
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: isProd ? { maxAge: 15552000, includeSubDomains: true } : false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  }),
);

app.use((req, res, next) => {
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

app.use(express.json({ limit: "64kb", strict: true, type: "application/json" }));
app.use(cookieParser());
app.use(rejectUnsafeInput);

const allowedOrigins = new Set([APP_ORIGIN]);
if (!isProd) {
  allowedOrigins.add("http://localhost:5173");
  allowedOrigins.add("http://127.0.0.1:5173");
  allowedOrigins.add(`http://localhost:${PORT}`);
  allowedOrigins.add(`http://127.0.0.1:${PORT}`);
}

app.use((req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.get("origin");
  if (!origin) return next();
  if (!allowedOrigins.has(origin)) {
    return res.status(403).json({ error: "Invalid request origin" });
  }
  next();
});

app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  next();
});
app.use("/api", require("./src/router/api_router"));
app.use("/api", (req, res) => res.status(404).json({ error: "Not found" }));

const webDist = path.join(__dirname, "..", "frontend", "dist");
if (fs.existsSync(webDist)) {
  app.use(
    "/app/assets",
    express.static(path.join(webDist, "assets"), { maxAge: "1y", immutable: true }),
  );
  app.use("/app", express.static(webDist, { index: false, maxAge: "1h" }));
  app.get(["/app", "/app/*"], (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.sendFile(path.join(webDist, "index.html"));
  });
}

app.get("/", (req, res) => res.redirect("/app/"));
app.get("/*", (req, res) => res.redirect(302, `/app${req.originalUrl}`));

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  console.error(err);

  if (req.originalUrl.startsWith("/api")) {
    if (err.type === "entity.parse.failed") {
      return res.status(400).json({ error: "Invalid JSON body" });
    }
    if (err.name === "CastError" || err.name === "ValidationError") {
      return res.status(400).json({ error: "Invalid request" });
    }
    if (err.code === 11000) {
      return res.status(409).json({ error: "This record already exists" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }

  return res.status(500).send("Internal server error");
});

const server = app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

async function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close(async () => {
    try {
      await mongoose.disconnect();
    } finally {
      process.exit(0);
    }
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (err) => console.error("Unhandled rejection:", err));
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  process.exit(1);
});

conDB();
