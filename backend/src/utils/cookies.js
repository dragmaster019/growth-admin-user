const SEVEN_DAYS = 7 * 24 * 3600 * 1000;

function isProd() {
  return process.env.NODE_ENV === "production";
}

function authCookieOptions() {
  return {
    httpOnly: true,
    secure: isProd(),
    sameSite: "lax",
    path: "/",
    maxAge: SEVEN_DAYS,
  };
}

function clearCookieOptions() {
  return {
    httpOnly: true,
    secure: isProd(),
    sameSite: "lax",
    path: "/",
  };
}

module.exports = { authCookieOptions, clearCookieOptions };
