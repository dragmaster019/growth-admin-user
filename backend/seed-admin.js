const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const userdetail = require("./src/models/userdetail");
const { isEmail, isPassword } = require("./src/utils/validation");

const email = process.env.ADMIN_EMAIL;
const pass = process.env.ADMIN_PASS;

if (!email || !pass) {
  console.log("ADMIN_EMAIL/PASS not set — will only backfill referral codes");
} else if (!isEmail(email) || !isPassword(pass)) {
  throw new Error("ADMIN_EMAIL must be valid and ADMIN_PASS must be 8-128 characters");
}

(async () => {
  await mongoose.connect(process.env.DB_URL, { serverSelectionTimeoutMS: 10000 });
  const { generateReferralCode } = require("./src/utils/referral");
  async function ensureUser({ name, email, pass, role, isFounder }) {
    let u = await userdetail.findOne({ email });
    if (u) {
      let patch = {};
      if (!u.referralCode) {
        let code;
        for (let i = 0; i < 5; i++) {
          code = generateReferralCode(u.name || name);
          if (!(await userdetail.findOne({ referralCode: code }))) break;
        }
        patch.referralCode = code;
      }
      if (!u.role) patch.role = role;
      if (isFounder && !u.isFounder) patch.isFounder = true;
      if (u.position === undefined) patch.position = "ROOT";
      if (Object.keys(patch).length) await userdetail.updateOne({ _id: u._id }, { $set: patch });
      console.log("Exists:", email, (u.referralCode || patch.referralCode));
      return;
    }
    const hashed = await bcrypt.hash(pass, await bcrypt.genSalt(10));
    let code;
    for (let i = 0; i < 5; i++) {
      code = generateReferralCode(name);
      if (!(await userdetail.findOne({ referralCode: code }))) break;
    }
    await userdetail.create({
      name, email, Id: Math.floor(Math.random() * 900000 + 100000),
      points: isFounder ? 100000 : 0, mobile: 9999999999,
      pass: hashed, parent: "", referralCode: code,
      referredBy: "", position: "ROOT", role, isFounder: !!isFounder,
    });
    console.log(`${isFounder ? "Founder" : role} created:`, email, code);
  }

  // Backfill old users without codes
  const olds = await userdetail.find({ $or: [{ referralCode: { $exists: false } }, { referralCode: null }, { referralCode: "" }] });
  for (const o of olds) {
    let code;
    for (let i = 0; i < 5; i++) {
      code = generateReferralCode(o.name || "USER");
      if (!(await userdetail.findOne({ referralCode: code }))) break;
    }
    await userdetail.updateOne({ _id: o._id }, { $set: { referralCode: code, position: o.position || "ROOT", role: o.role || "user" } });
    console.log("Backfilled:", o.email, code);
  }

  if (email && pass) await ensureUser({ name: "Admin", email, pass, role: "admin", isFounder: true });
  // 3 founders: ADMIN_EMAIL + FOUNDER2_EMAIL / FOUNDER3_EMAIL (same ADMIN_PASS if not set)
  const f2e = process.env.FOUNDER2_EMAIL, f3e = process.env.FOUNDER3_EMAIL;
  const fp = process.env.FOUNDER_PASS || pass;
  if (f2e && fp) await ensureUser({ name: "Founder Two", email: f2e, pass: fp, role: "admin", isFounder: true });
  if (f3e && fp) await ensureUser({ name: "Founder Three", email: f3e, pass: fp, role: "admin", isFounder: true });
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
