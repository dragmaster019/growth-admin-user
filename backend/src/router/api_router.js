const express = require("express");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const { api_auth, api_admin } = require("../api_auth");
const api = require("../service/api_service");

const limitMessage = (message) => ({ error: message });

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: limitMessage("Too many requests. Please try again later."),
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: limitMessage("Too many login attempts. Please try again later."),
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: limitMessage("Too many signup attempts. Please try again later."),
});

const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: limitMessage("Too many reset requests. Please try again later."),
});

const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: limitMessage("Too many reset attempts. Please try again later."),
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: limitMessage("Too many requests. Please try again later."),
});

const drawLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: limitMessage("Too many lucky draw attempts. Please try again later."),
});

const payoutLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: limitMessage("Too many payout requests. Please try again later."),
});

const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get("/health", (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ ok: ready });
});

router.use(globalLimiter);

// Public
router.post("/auth/login", loginLimiter, h(api.login));
router.post("/auth/register", registerLimiter, h(api.join));
router.post("/auth/forgot-password", forgotLimiter, h(api.forgotPassword));
router.post("/auth/reset-password", resetLimiter, h(api.resetPassword));
router.post("/auth/logout", h(api.logout));
router.get("/auth/referrer/:code", h(api.referrer));
router.post("/contact", contactLimiter, h(api.contactSubmit));
router.get("/contact/admin", api_auth, api_admin, h(api.listContactSubmissions));
router.patch("/contact/:id", api_auth, api_admin, h(api.updateContactStatus));

// Authenticated
router.get("/auth/me", api_auth, h(api.me));

router.get("/lucky-draw", api_auth, api_admin, h(api.luckyDrawStatus));
router.post("/lucky-draw", api_auth, api_admin, drawLimiter, h(api.luckyDraw));

router.get("/dashboard/admin", api_auth, api_admin, h(api.adminDashboard));
router.get("/dashboard/user", api_auth, h(api.userDashboard));

router.get("/tree", api_auth, h(api.tree));

router.get("/leaderboard", api_auth, h(api.leaderboard));
router.get("/payouts", api_auth, h(api.listPayouts));
router.post("/payouts", api_auth, payoutLimiter, h(api.createPayout));
router.patch("/payouts/:id", api_auth, api_admin, h(api.updatePayout));

// Products feature temporarily disabled
// router.get("/products", api_auth, h(api.listProducts));
// router.post("/products", api_auth, api_admin, h(api.createProduct));
// router.patch("/products/:id", api_auth, api_admin, h(api.updateProduct));
// router.delete("/products/:id", api_auth, api_admin, h(api.deleteProduct));
// router.post("/products/:id/buy", api_auth, h(api.buyProduct));

router.get("/transactions", api_auth, h(api.transactions));

router.get("/users", api_auth, h(api.listUsers));
router.patch("/users/:id", api_auth, api_admin, h(api.updateUser));
router.delete("/users/:id", api_auth, api_admin, h(api.deleteUser));
router.patch("/users/:id/points", api_auth, api_admin, h(api.adjustPoints));
router.post("/users/:id/reset-password", api_auth, api_admin, h(api.resetUserPassword));

router.patch("/me/profile", api_auth, h(api.updateProfile));
router.post("/me/password", api_auth, h(api.changePassword));

module.exports = router;
