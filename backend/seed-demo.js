const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const userdetail = require("./src/models/userdetail");
const productdetail = require("./src/models/productdetail");
const { generateReferralCode } = require("./src/utils/referral");

const DEMO_PASS = "Demo1234!";

if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
  console.error("Refusing to seed demo accounts in production. Set ALLOW_DEMO_SEED=true to override.");
  process.exit(1);
}

async function codeFor(preferred, name) {
  if (preferred) {
    const taken = await userdetail.findOne({ referralCode: preferred });
    if (!taken) return preferred;
  }
  for (let i = 0; i < 8; i++) {
    const c = generateReferralCode(name);
    if (!(await userdetail.findOne({ referralCode: c }))) return c;
  }
  return `${Date.now().toString(36).toUpperCase().slice(-6)}-D`;
}

async function ensureUser({ name, email, preferredCode, points, role, isFounder, sponsorCode, position }) {
  let u = await userdetail.findOne({ email });
  const hashed = await bcrypt.hash(DEMO_PASS, await bcrypt.genSalt(10));
  if (!u) {
    const code = await codeFor(preferredCode, name);
    let parentEmail = "", referredBy = "";
    if (sponsorCode) {
      const sponsor = await userdetail.findOne({ referralCode: sponsorCode });
      if (!sponsor) throw new Error(`sponsor ${sponsorCode} not found for ${email}`);
      // deterministic leg if free, else BFS spillover
      const clash = await userdetail.findOne({ referredBy: sponsorCode, position });
      if (clash) {
        const { findPlacement } = require("./src/utils/tree");
        const spot = await findPlacement(sponsorCode);
        parentEmail = spot.parentDoc.email;
        referredBy = spot.parentDoc.referralCode;
        position = spot.position;
      } else {
        parentEmail = sponsor.email;
        referredBy = sponsorCode;
      }
    }
    u = await userdetail.create({
      name, email, Id: Math.floor(Math.random() * 900000 + 100000),
      points, mobile: 9000000000 + Math.floor(Math.random() * 9999999),
      pass: hashed, parent: parentEmail,
      referralCode: code, referredBy, position: position || "ROOT",
      role, isFounder: !!isFounder,
    });
    console.log(`created ${email} ${code} ${position || "ROOT"} pts=${points}`);
  } else {
    const patch = { role, isFounder: !!isFounder, points };
    if (!u.referralCode) patch.referralCode = await codeFor(preferredCode, u.name || name);
    if (!u.pass) patch.pass = hashed;
    await userdetail.updateOne({ _id: u._id }, { $set: patch });
    u = await userdetail.findOne({ email });
    console.log(`reset   ${email} ${u.referralCode} pts=${points}`);
  }
  return u;
}

async function ensureProduct({ name, price, qty, desc }) {
  let p = await productdetail.findOne({ Product_name: name });
  if (!p) {
    p = await productdetail.create({ Product_name: name, Price: price, Quantity: qty, Description: desc, Image: "" });
    console.log(`created product ${name} ₹${price} x${qty}`);
  } else {
    await productdetail.updateOne({ _id: p._id }, { $set: { Price: price, Quantity: qty, Description: desc } });
    console.log(`reset   product ${name} ₹${price} x${qty}`);
  }
  return p;
}

(async () => {
  await mongoose.connect(process.env.DB_URL, { serverSelectionTimeoutMS: 10000 });
  console.log("mongo ok");

  const A = await ensureUser({ name: "Alice Founder", email: "alice.demo@mlm.local", preferredCode: "ALICE-D01", points: 100000, role: "admin", isFounder: true });
  const B = await ensureUser({ name: "Bob Demo", email: "bob.demo@mlm.local", preferredCode: "BOB-D02", points: 5000, role: "user", sponsorCode: A.referralCode, position: "LEFT" });
  const C = await ensureUser({ name: "Cara Demo", email: "cara.demo@mlm.local", preferredCode: "CARA-D03", points: 5000, role: "user", sponsorCode: A.referralCode, position: "MIDDLE" });
  // D goes deeper: under B LEFT -> proves BFS/DFS traversal depth 2
  const Bfresh = await userdetail.findOne({ email: B.email });
  const D = await ensureUser({ name: "Dev Demo", email: "dev.demo@mlm.local", preferredCode: "DEV-D04", points: 5000, role: "user", sponsorCode: Bfresh.referralCode, position: "LEFT" });

  await ensureProduct({ name: "Neon Hoodie", price: 500, qty: 20, desc: "Gen-Z certified hoodie 👀 limited drop" });
  await ensureProduct({ name: "Holo Cap", price: 250, qty: 50, desc: "Holographic cap ✨ pay with points" });

  console.log("\n--- DEMO READY ---");
  for (const e of ["alice.demo@mlm.local", "bob.demo@mlm.local", "cara.demo@mlm.local", "dev.demo@mlm.local"]) {
    const u = await userdetail.findOne({ email: e }).lean();
    console.log(`${u.name} | ${e} / ${DEMO_PASS} | code=${u.referralCode} | leg=${u.position} under=${u.referredBy || "ROOT"} | pts=${u.points}`);
  }
  console.log(`invite link: /join?ref=${A.referralCode} (then B/C/D codes work too)`);
  console.log(`tree: /tree?code=${A.referralCode}  api: /api/tree?code=${A.referralCode}`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
