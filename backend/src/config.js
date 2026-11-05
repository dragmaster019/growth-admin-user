const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const isProd = process.env.NODE_ENV === "production";

function fail(message) {
  console.error(`Configuration error: ${message}`);
  process.exit(1);
}

function readAppUrl() {
  const value = String(process.env.APP_URL || "").trim();
  if (!value) {
    if (isProd) fail("APP_URL is required in production");
    return "http://localhost:4000/app";
  }
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("invalid protocol");
    if (isProd && url.protocol !== "https:") fail("APP_URL must use https in production");
    return value.replace(/\/$/, "");
  } catch {
    fail("APP_URL must be a valid absolute URL");
  }
}

const DB_URL = String(process.env.DB_URL || "").trim();
const SECRET_KEY = String(process.env.SECRET_KEY || "").trim();

if (!DB_URL) fail("DB_URL is required");
if (SECRET_KEY.length < 32) fail("SECRET_KEY must be at least 32 characters");
if (isProd && /^(change[-_]?me|secret|password|test)/i.test(SECRET_KEY)) {
  fail("SECRET_KEY still looks like a placeholder");
}

const port = Number(process.env.PORT || 4000);
if (!Number.isSafeInteger(port) || port < 1 || port > 65535) fail("PORT is invalid");

const appUrl = readAppUrl();
const pointValue = Number(process.env.POINT_VALUE_INR || 12);
const minPayout = Number(process.env.MIN_PAYOUT || 500);
const bcryptRounds = Number(process.env.BCRYPT_ROUNDS || (isProd ? 12 : 10));

if (!Number.isFinite(pointValue) || pointValue <= 0) fail("POINT_VALUE_INR must be positive");
if (!Number.isSafeInteger(minPayout) || minPayout < 1) fail("MIN_PAYOUT must be a positive integer");
if (!Number.isSafeInteger(bcryptRounds) || bcryptRounds < 10 || bcryptRounds > 14) {
  fail("BCRYPT_ROUNDS must be between 10 and 14");
}

module.exports = {
  isProd,
  DB_URL,
  SECRET_KEY,
  PORT: port,
  APP_URL: appUrl,
  APP_ORIGIN: new URL(appUrl).origin,
  POINT_VALUE_INR: pointValue,
  MIN_PAYOUT: minPayout,
  BCRYPT_ROUNDS: bcryptRounds,
};
