const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const REFERRAL_RE = /^[A-Z0-9][A-Z0-9-]{2,31}$/;
const HEX_TOKEN_RE = /^[a-f0-9]{64}$/i;

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value) {
  return text(value).toLowerCase();
}

function isEmail(value) {
  const email = normalizeEmail(value);
  return email.length > 3 && email.length <= 254 && EMAIL_RE.test(email);
}

function isPassword(value) {
  return typeof value === "string" && value.length >= 8 && value.length <= 128;
}

function isReferralCode(value) {
  return REFERRAL_RE.test(text(value).toUpperCase());
}

function isHexToken(value) {
  return typeof value === "string" && HEX_TOKEN_RE.test(value);
}

function isPhone(value) {
  if (value === undefined || value === null || value === "") return true;
  const digits = String(value).replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

function isSafePoints(value) {
  return Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000_000;
}

module.exports = {
  text,
  normalizeEmail,
  isEmail,
  isPassword,
  isReferralCode,
  isHexToken,
  isPhone,
  isSafePoints,
};
