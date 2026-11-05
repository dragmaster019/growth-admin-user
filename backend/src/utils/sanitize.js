const BLOCKED_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function hasUnsafeKeys(value, depth = 0) {
  if (depth > 10 || value === null || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((item) => hasUnsafeKeys(item, depth + 1));

  for (const key of Object.keys(value)) {
    if (key.startsWith("$") || key.includes(".") || BLOCKED_KEYS.has(key)) return true;
    if (hasUnsafeKeys(value[key], depth + 1)) return true;
  }
  return false;
}

function rejectUnsafeInput(req, res, next) {
  if (hasUnsafeKeys(req.body) || hasUnsafeKeys(req.query)) {
    return res.status(400).json({ error: "Invalid request" });
  }
  next();
}

module.exports = { rejectUnsafeInput };
