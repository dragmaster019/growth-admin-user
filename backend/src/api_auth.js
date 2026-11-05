const jwt = require("jsonwebtoken");
const userModel = require("./models/userdetail");
const { SECRET_KEY } = require("./config");
const { hashToken } = require("./utils/tokens");

const JWT_OPTIONS = { algorithms: ["HS256"], issuer: "growth", audience: "growth-web" };

async function api_auth(req, res, next) {
  try {
    const token = req.cookies && req.cookies.token;
    if (!token) return res.status(401).json({ error: "Not authenticated" });
    const decoded = jwt.verify(token, SECRET_KEY, JWT_OPTIONS);
    const user = await userModel.findOne({ _id: decoded.id });
    if (!user) return res.status(401).json({ error: "Invalid session" });
    if (!user.auth_key || user.auth_key !== hashToken(token)) {
      return res.status(401).json({ error: "Session ended" });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid session" });
  }
}

function api_admin(req, res, next) {
  const role = req.user && (req.user.role || (req.user.parent === "" ? "admin" : "user"));
  if (role !== "admin") return res.status(403).json({ error: "Admins only" });
  next();
}

module.exports = { api_auth, api_admin };
