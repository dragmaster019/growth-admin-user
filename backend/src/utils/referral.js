const crypto = require("crypto");

function baseFromName(name = "USER") {
  const clean = String(name).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  return clean || "USER";
}

function randSuffix(len = 4) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[crypto.randomInt(chars.length)];
  return s;
}

function generateReferralCode(name) {
  return `${baseFromName(name)}-${randSuffix(4)}`;
}

const LEGS = ["LEFT", "MIDDLE", "RIGHT"];

module.exports = { generateReferralCode, LEGS };
