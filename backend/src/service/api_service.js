const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const userdetail = require("../models/userdetail");
const productdetail = require("../models/productdetail");
const transaction = require("../models/transaction");
const { generateReferralCode } = require("../utils/referral");
const { findPlacement, buildTree, countDownline } = require("../utils/tree");
const { creditJoinCommission } = require("../utils/commission");
const { authCookieOptions, clearCookieOptions } = require("../utils/cookies");
const { hashToken } = require("../utils/tokens");
const { sendPasswordResetEmail, smtpConfigured } = require("../utils/email");
const { pickPrize, dayKey } = require("../utils/luckyDraw");
const LuckyDraw = require("../models/luckydraw");
const ContactSubmission = require("../models/contactsubmission");
const PayoutRequest = require("../models/payoutrequest");
const { rankForPoints, nextRankForPoints } = require("../utils/rank");
const {
  SECRET_KEY,
  APP_URL,
  MIN_PAYOUT,
  POINT_VALUE_INR,
  BCRYPT_ROUNDS,
} = require("../config");
const {
  text,
  normalizeEmail,
  isEmail,
  isPassword,
  isReferralCode,
  isHexToken,
  isPhone,
  isSafePoints,
} = require("../utils/validation");

const PASSWORD_RESET_TTL_MIN = 15;
const PASSWORD_RESET_TTL_MS = PASSWORD_RESET_TTL_MIN * 60 * 1000;
const JWT_SIGN_OPTIONS = { expiresIn: "7d", issuer: "growth", audience: "growth-web" };
const JWT_VERIFY_OPTIONS = { algorithms: ["HS256"], issuer: "growth", audience: "growth-web" };
const DUMMY_HASH = bcrypt.hashSync(crypto.randomBytes(16).toString("hex"), BCRYPT_ROUNDS);

const hashResetToken = (token) => crypto.createHash("sha256").update(String(token)).digest("hex");
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const isValidId = (id) => /^[a-f\d]{24}$/i.test(String(id || ""));

const roleOf = (u) => u.role || (u.parent === "" ? "admin" : "user");
const isServerError = (res, err) => {
  console.error("[api]", err);
  if (!res.headersSent) res.status(500).json({ error: "Internal server error" });
};

const publicUser = (u) => {
  const rank = rankForPoints(u.points);
  return {
    _id: String(u._id),
    name: u.name,
    email: u.email,
    Id: u.Id,
    points: u.points,
    mobile: u.mobile,
    parent: u.parent,
    referralCode: u.referralCode,
    referredBy: u.referredBy,
    position: u.position,
    role: roleOf(u),
    isFounder: !!u.isFounder,
    rank: rank.name,
    rankKey: rank.key,
    rankEmoji: rank.emoji,
  };
};

const publicLeaderboardUser = (u) => {
  const rank = rankForPoints(u.points);
  return {
    _id: String(u._id),
    name: u.name,
    points: u.points,
    referralCode: u.referralCode,
    role: roleOf(u),
    isFounder: !!u.isFounder,
    rank: rank.name,
    rankKey: rank.key,
    rankEmoji: rank.emoji,
  };
};

// Regular users only: admins are excluded from the lucky draw.
const LUCKY_DRAW_ELIGIBLE = {
  $and: [
    { $or: [{ role: "user" }, { role: { $exists: false }, parent: { $ne: "" } }] },
    { email: { $ne: "" } },
    { parent: { $ne: "" } },
  ],
};

const publicDraw = (draw) => ({
  _id: String(draw._id),
  dayKey: draw.dayKey,
  drawnAt: draw.drawnAt,
  drawnBy: draw.drawnBy,
  winnerId: draw.winnerId,
  winnerName: draw.winnerName,
  winnerEmail: draw.winnerEmail,
  prize: draw.prize,
});

const publicPayout = (p) => ({
  _id: String(p._id),
  userId: String(p.userId),
  name: p.name,
  email: p.email,
  amount: p.amount,
  method: p.method,
  destination: p.destination,
  note: p.note,
  status: p.status,
  adminNote: p.adminNote,
  reviewedBy: p.reviewedBy,
  reviewedAt: p.reviewedAt,
  createdAt: p.createdAt,
});

async function ensureUniqueCode(name) {
  for (let i = 0; i < 8; i++) {
    const code = generateReferralCode(name);
    if (!(await userdetail.findOne({ referralCode: code }))) return code;
  }
  return `${String(name).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) || "USER"}-${Date.now().toString(36).toUpperCase()}`;
}

/* ---------------- Auth ---------------- */

exports.login = async (req, res) => {
  try {
    const email = normalizeEmail((req.body || {}).email);
    const pass = (req.body || {}).pass;
    if (!isEmail(email) || typeof pass !== "string" || pass.length < 1 || pass.length > 128) {
      return res.status(400).json({ error: "Enter a valid email and password" });
    }
    const found = await userdetail.findOne({ email });
    if (!found) {
      await bcrypt.compare(pass, DUMMY_HASH);
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const valid = await bcrypt.compare(pass, found.pass);
    if (!valid) return res.status(401).json({ error: "Invalid email or password" });
    const token = jwt.sign({ id: found._id }, SECRET_KEY, JWT_SIGN_OPTIONS);
    res.cookie("token", token, authCookieOptions());
    await userdetail.updateOne({ _id: found._id }, { $set: { auth_key: hashToken(token) } });
    res.json({ user: publicUser(found) });
  } catch (e) {
    isServerError(res, e);
  }
};

exports.logout = async (req, res) => {
  try {
    res.clearCookie("token", clearCookieOptions());
    const token = req.cookies && req.cookies.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, SECRET_KEY, JWT_VERIFY_OPTIONS);
        await userdetail.updateOne({ _id: decoded.id }, { $set: { auth_key: "" } });
      } catch {
        // Expired or malformed cookies still need to be cleared.
      }
    }
    res.json({ ok: true });
  } catch (e) {
    isServerError(res, e);
  }
};

exports.me = async (req, res) => {
  res.json({ user: publicUser(req.user) });
};

/* ---------------- Lucky draw ---------------- */

exports.luckyDrawStatus = async (req, res) => {
  try {
    const today = dayKey();
    const [lastDraw, eligible] = await Promise.all([
      LuckyDraw.findOne({}).sort({ drawnAt: -1 }).lean(),
      userdetail.countDocuments(LUCKY_DRAW_ELIGIBLE),
    ]);
    res.json({
      today,
      canDraw: !lastDraw || lastDraw.dayKey !== today,
      eligible,
      lastDraw: lastDraw ? publicDraw(lastDraw) : null,
    });
  } catch (e) {
    isServerError(res, e);
  }
};

exports.luckyDraw = async (req, res) => {
  let draw;
  try {
    const today = dayKey();
    try {
      // The unique dayKey is the lock: only one draw can be created per day,
      // even if the admin double-clicks or opens several tabs.
      draw = await LuckyDraw.create({
        dayKey: today,
        drawnAt: new Date(),
        drawnBy: req.user.email,
      });
    } catch (e) {
      if (e.code === 11000) {
        const lastDraw = await LuckyDraw.findOne({ dayKey: today }).lean();
        return res.status(429).json({
          error: "Today's lucky draw is already complete.",
          canDraw: false,
          lastDraw: lastDraw ? publicDraw(lastDraw) : null,
        });
      }
      throw e;
    }

    const [winner] = await userdetail.aggregate([
      { $match: LUCKY_DRAW_ELIGIBLE },
      { $sample: { size: 1 } },
    ]);

    if (!winner) {
      await LuckyDraw.deleteOne({ _id: draw._id });
      return res.status(400).json({ error: "No regular users are eligible for the draw." });
    }

    const prize = pickPrize();
    const fresh = await userdetail.findByIdAndUpdate(winner._id, { $inc: { points: prize } }, { new: true });
    if (!fresh) {
      await LuckyDraw.deleteOne({ _id: draw._id });
      return res.status(400).json({ error: "The selected user no longer exists. Try again." });
    }

    const txn = await transaction.create({
      amount: prize,
      from: "Lucky draw",
      to: fresh.email,
      type: "lucky draw",
    });

    const completed = await LuckyDraw.findByIdAndUpdate(
      draw._id,
      {
        $set: {
          winnerId: String(fresh._id),
          winnerName: fresh.name,
          winnerEmail: fresh.email,
          prize,
        },
      },
      { new: true },
    ).lean();

    res.json({
      draw: publicDraw(completed),
      winner: publicUser(fresh),
      prize,
      txn,
    });
  } catch (e) {
    // Keep the day reserved after an unexpected failure so a retry cannot
    // award the same day twice. It is safer to inspect/delete the record.
    isServerError(res, e);
  }
};

exports.referrer = async (req, res) => {
  const code = text(req.params.code).toUpperCase();
  if (!isReferralCode(code)) return res.status(400).json({ error: "Invalid referral code" });
  const sponsor = await userdetail.findOne({ referralCode: code }).lean();
  if (!sponsor) return res.status(404).json({ error: "Invalid referral code" });
  res.json({ sponsor: { name: sponsor.name, referralCode: sponsor.referralCode } });
};

exports.forgotPassword = async (req, res) => {
  const email = normalizeEmail((req.body || {}).email);
  if (!isEmail(email)) return res.status(400).json({ error: "Enter a valid email" });

  const user = await userdetail.findOne({ email });

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    await userdetail.updateOne(
      { _id: user._id },
      {
        $set: {
          resetTokenHash: hashResetToken(token),
          resetTokenExpires: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
        },
      },
    );

    const resetUrl = `${APP_URL}/reset-password?token=${token}`;

    if (smtpConfigured()) {
      try {
        await sendPasswordResetEmail({
          to: user.email,
          name: user.name,
          resetUrl,
          expiresMinutes: PASSWORD_RESET_TTL_MIN,
        });
      } catch (e) {
        console.error("Password reset email failed:", e.message);
      }
    } else if (process.env.NODE_ENV !== "production") {
      console.log(`[dev] Password reset link for ${user.email}: ${resetUrl}`);
    }
  }

  res.json({ ok: true, message: "If that email exists, a reset link has been sent." });
};

exports.resetPassword = async (req, res) => {
  const { token, pass, conpass } = req.body || {};
  if (!isHexToken(token) || !isPassword(pass) || typeof conpass !== "string") {
    return res.status(400).json({ error: "Enter a valid reset token and an 8–128 character password" });
  }
  if (pass !== conpass) return res.status(400).json({ error: "New passwords do not match" });

  const user = await userdetail.findOne({
    resetTokenHash: hashResetToken(token),
    resetTokenExpires: { $gt: new Date() },
  });
  if (!user) return res.status(400).json({ error: "Reset link is invalid or has expired" });

  const hashed = await bcrypt.hash(pass, BCRYPT_ROUNDS);
  await userdetail.updateOne(
    { _id: user._id },
    {
      $set: {
        pass: hashed,
        auth_key: "",
        resetTokenHash: "",
        resetTokenExpires: null,
      },
    },
  );
  res.json({ ok: true });
};

/* ---------------- Public join ---------------- */

exports.join = async (req, res) => {
  try {
    const body = req.body || {};
    const name = text(body.name);
    const email = normalizeEmail(body.email);
    const mobile = text(body.mobile).replace(/\D/g, "");
    const pass = body.pass;
    const referralCode = text(body.referralCode).toUpperCase();
    const position = text(body.position).toUpperCase();

    if (name.length < 2 || name.length > 80) {
      return res.status(400).json({ error: "Name must be between 2 and 80 characters" });
    }
    if (!isEmail(email)) return res.status(400).json({ error: "Enter a valid email" });
    if (!isPassword(pass)) {
      return res.status(400).json({ error: "Password must be between 8 and 128 characters" });
    }
    if (!isReferralCode(referralCode)) return res.status(400).json({ error: "Invalid referral code" });
    if (!isPhone(mobile)) return res.status(400).json({ error: "Enter a valid mobile number" });
    if (position && !["LEFT", "MIDDLE", "RIGHT"].includes(position)) {
      return res.status(400).json({ error: "Invalid position" });
    }

    const existing = await userdetail.findOne({
      email: { $regex: `^${escapeRegex(email)}$`, $options: "i" },
    });
    if (existing) return res.status(400).json({ error: "Email already registered" });

    const sponsor = await userdetail.findOne({ referralCode });
    if (!sponsor) return res.status(400).json({ error: "Invalid referral code" });

    let parentDoc = sponsor;
    let leg = position;
    if (!["LEFT", "MIDDLE", "RIGHT"].includes(leg)) {
      const spot = await findPlacement(sponsor.referralCode);
      parentDoc = spot.parentDoc;
      leg = spot.position;
    } else {
      const clash = await userdetail.findOne({ referredBy: sponsor.referralCode, position: leg });
      if (clash) {
        const spot = await findPlacement(clash.referralCode);
        parentDoc = spot.parentDoc;
        leg = spot.position;
      }
    }

    const hashed = await bcrypt.hash(pass, BCRYPT_ROUNDS);
    const myCode = await ensureUniqueCode(name);
    const nu = await userdetail.create({
      name,
      email,
      mobile: mobile ? Number(mobile) : null,
      pass: hashed,
      parent: parentDoc.email,
      referralCode: myCode,
      referredBy: parentDoc.referralCode,
      position: leg,
      role: "user",
      points: 0,
    });
    await creditJoinCommission(nu);
    res.status(201).json({ user: publicUser(nu), code: myCode });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: "Email is already registered" });
    isServerError(res, e);
  }
};

/* ---------------- Dashboards ---------------- */

exports.adminDashboard = async (req, res) => {
  try {
    const me = req.user;
    if (!me.referralCode) return res.status(400).json({ error: "Run seed-admin.js to backfill referral codes, then re-login." });
    const [totalUsers, totalProducts, txns, founders, totals, pendingPayouts] = await Promise.all([
      userdetail.countDocuments({}),
      productdetail.countDocuments({}),
      transaction.find({}).sort({ createdAt: -1 }).limit(20).lean(),
      userdetail.find({ isFounder: true }).lean(),
      userdetail.aggregate([{ $group: { _id: null, s: { $sum: "$points" } } }]),
      PayoutRequest.countDocuments({ status: "pending" }),
    ]);
    res.json({
      me: publicUser(me),
      stats: {
        totalUsers,
        totalProducts,
        totalPoints: totals[0]?.s || 0,
        founderCount: founders.length,
        pendingPayouts,
      },
      txns,
      founders: founders.map(publicUser),
      pointValue: POINT_VALUE_INR,
    });
  } catch (e) {
    isServerError(res, e);
  }
};

exports.userDashboard = async (req, res) => {
  try {
    const me = req.user;
    if (!me.referralCode) return res.status(400).json({ error: "Run seed-admin.js to backfill referral codes, then re-login." });
    const [direct, downline, myTxns, products] = await Promise.all([
      userdetail.find({ referredBy: me.referralCode }).lean(),
      countDownline(me.referralCode),
      transaction.find({ to: me.email }).sort({ createdAt: -1 }).limit(20).lean(),
      productdetail.find({}).limit(6).lean(),
    ]);
    res.json({
      me: publicUser(me),
      direct: direct.map(publicUser),
      downline,
      myTxns,
      // products: products.map(publicProduct), // Products feature temporarily disabled
      referralLink: `/app/join?ref=${me.referralCode}`,
      pointValue: POINT_VALUE_INR,
    });
  } catch (e) {
    isServerError(res, e);
  }
};

/* ---------------- Tree ---------------- */

const safeNode = (n) => ({
  _id: String(n._id),
  name: n.name,
  email: n.email,
  referralCode: n.referralCode,
  position: n.position,
  points: n.points,
  role: roleOf(n),
  isFounder: !!n.isFounder,
  children: (n.children || []).map(safeNode),
});

exports.tree = async (req, res) => {
  const isAdmin = roleOf(req.user) === "admin";
  let code = String(req.query.code || "").toUpperCase();
  if (!isAdmin) {
    const own = String(req.user.referralCode || "").toUpperCase();
    if (code && code !== own)
      return res.status(403).json({ error: "You can only view your own tree" });
    code = own;
  }
  if (!code) code = String(req.user.referralCode || "").toUpperCase();
  if (!code) return res.status(400).json({ error: "code required" });
  const tree = await buildTree(code, 6);
  if (!tree) return res.status(404).json({ error: "not found" });
  res.json({ code, tree: safeNode(tree) });
};

/* ---------------- Products ---------------- */

exports.listProducts = async (req, res) => {
  const products = await productdetail.find({}).sort({ _id: -1 }).lean();
  res.json({ products, role: roleOf(req.user) });
};

exports.createProduct = async (req, res) => {
  const { name, price, quantity, description, image } = req.body || {};
  if (!name || !Number.isFinite(Number(price))) return res.status(400).json({ error: "name and price required" });
  const p = await productdetail.create({
    Product_name: name, Price: Number(price), Quantity: Number(quantity) || 0,
    Description: description || "", Image: image || "",
  });
  res.status(201).json({ product: p });
};

exports.updateProduct = async (req, res) => {
  const { name, price, quantity, description, image } = req.body || {};
  const patch = {};
  if (name !== undefined) patch.Product_name = name;
  if (price !== undefined) patch.Price = Number(price);
  if (quantity !== undefined) patch.Quantity = Number(quantity);
  if (description !== undefined) patch.Description = description;
  if (image !== undefined) patch.Image = image;
  const p = await productdetail.findByIdAndUpdate(req.params.id, { $set: patch }, { new: true });
  if (!p) return res.status(404).json({ error: "Product not found" });
  res.json({ product: p });
};

exports.deleteProduct = async (req, res) => {
  const r = await productdetail.deleteOne({ _id: req.params.id });
  if (!r.deletedCount) return res.status(404).json({ error: "Product not found" });
  res.json({ ok: true });
};

exports.buyProduct = async (req, res) => {
  try {
    const buyer = await userdetail.findOne({ _id: req.user._id });
    const qty = Number(req.body.quantity) || 1;
    const product = await productdetail.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    if (!Number.isFinite(qty) || qty <= 0) return res.status(400).json({ error: "Invalid quantity" });
    const total = product.Price * qty;
    if (buyer.points < total)
      return res.status(400).json({ error: `Insufficient balance: need ${total}, have ${buyer.points}` });
    if (product.Quantity < qty)
      return res.status(400).json({ error: `Only ${product.Quantity} left in stock` });

    await userdetail.updateOne({ _id: buyer._id }, { $inc: { points: -total } });
    await productdetail.updateOne({ _id: product._id }, { $inc: { Quantity: -qty } });

    let a = total, cur = total;
    let parentCode = buyer.referredBy;
    while (parentCode) {
      const parentUser = await userdetail.findOne({ referralCode: parentCode });
      if (!parentUser) break;
      const share = cur / 4;
      a -= share;
      await userdetail.updateOne({ referralCode: parentCode }, { $inc: { points: share } });
      await transaction.create({ amount: share, from: buyer.email, to: parentUser.email, type: "product purchased" });
      if (!parentUser.referredBy) {
        await userdetail.updateOne({ referralCode: parentCode }, { $inc: { points: a } });
        await transaction.create({ amount: a, from: buyer.email, to: parentUser.email, type: "product purchased (root remainder)" });
        a = 0;
        break;
      }
      parentCode = parentUser.referredBy;
      cur = (3 * cur) / 4;
    }
    if (a > 0) {
      const roots = await userdetail.find({ isFounder: true });
      if (roots.length) {
        const per = a / roots.length;
        for (const r of roots) {
          await userdetail.updateOne({ _id: r._id }, { $inc: { points: per } });
          await transaction.create({ amount: per, from: buyer.email, to: r.email, type: "product purchased (founder pool)" });
        }
      }
    }
    const fresh = await userdetail.findById(buyer._id);
    res.json({ ok: true, points: fresh.points, product: { _id: product._id, Quantity: product.Quantity - qty } });
  } catch (e) {
    isServerError(res, e);
  }
};

/* ---------------- Transactions ---------------- */

exports.transactions = async (req, res) => {
  const me = req.user;
  // Users only see points credited to them. A joiner's "new registration"
  // transaction is from the joiner but belongs to the parent's income, so it
  // must not show up in the joiner's own transaction list.
  const filter = roleOf(me) === "admin" ? {} : { to: me.email };
  const txns = await transaction.find(filter).sort({ createdAt: -1 }).limit(100).lean();
  res.json({ txns });
};

/* ---------------- Leaderboard ---------------- */

exports.leaderboard = async (req, res) => {
  try {
    const me = req.user;
    const base = {
      $or: [{ role: "user" }, { role: { $exists: false }, parent: { $ne: "" } }],
      email: { $ne: "" },
      parent: { $ne: "" },
    };

    const [top, total, aboveMe] = await Promise.all([
      userdetail.find(base).sort({ points: -1, _id: 1 }).limit(20).lean(),
      userdetail.countDocuments(base),
      userdetail.countDocuments({ ...base, points: { $gt: Number(me.points) || 0 } }),
    ]);

    const codes = top.map((u) => u.referralCode).filter(Boolean);
    const directRows = codes.length
      ? await userdetail.aggregate([
          { $match: { referredBy: { $in: codes } } },
          { $group: { _id: "$referredBy", count: { $sum: 1 } } },
        ])
      : [];
    const directMap = new Map(directRows.map((row) => [row._id, row.count]));

    const [directCount, teamSize] = await Promise.all([
      userdetail.countDocuments({ referredBy: me.referralCode }),
      countDownline(me.referralCode),
    ]);

    res.json({
      leaderboard: top.map((u, index) => ({
        ...publicLeaderboardUser(u),
        directCount: directMap.get(u.referralCode) || 0,
        rankPosition: index + 1,
        isMe: String(u._id) === String(me._id),
      })),
      me: {
        ...publicUser(me),
        directCount,
        teamSize,
        rankPosition: aboveMe + 1,
        nextRank: nextRankForPoints(me.points),
      },
      total,
      pointValue: POINT_VALUE_INR,
    });
  } catch (e) {
    isServerError(res, e);
  }
};

/* ---------------- Payouts ---------------- */

exports.listPayouts = async (req, res) => {
  try {
    const admin = roleOf(req.user) === "admin";
    const filter = admin ? {} : { userId: req.user._id };
    const [requests, pendingCount] = await Promise.all([
      PayoutRequest.find(filter).sort({ createdAt: -1 }).limit(100).lean(),
      PayoutRequest.countDocuments(admin ? { status: "pending" } : { userId: req.user._id, status: "pending" }),
    ]);
    res.json({
      requests: requests.map(publicPayout),
      role: roleOf(req.user),
      balance: Number(req.user.points) || 0,
      minPayout: MIN_PAYOUT,
      pendingCount,
      pointValue: POINT_VALUE_INR,
    });
  } catch (e) {
    isServerError(res, e);
  }
};

exports.createPayout = async (req, res) => {
  try {
    const body = req.body || {};
    const value = Number(body.amount);
    if (!Number.isSafeInteger(value) || !isSafePoints(value) || value <= 0) {
      return res.status(400).json({ error: "Enter a valid whole-number amount" });
    }
    if (value < MIN_PAYOUT) return res.status(400).json({ error: `Minimum payout is ${MIN_PAYOUT} points` });
    if (value > (Number(req.user.points) || 0))
      return res.status(400).json({ error: "Amount is higher than your available balance" });

    const mode = text(body.method || "upi").toLowerCase();
    if (!["upi", "bank", "paypal"].includes(mode)) return res.status(400).json({ error: "Invalid payout method" });

    const target = text(body.destination);
    if (target.length < 3 || target.length > 160) {
      return res.status(400).json({ error: "Add a valid UPI ID, bank account or PayPal email" });
    }

    const pending = await PayoutRequest.findOne({ userId: req.user._id, status: "pending" });
    if (pending)
      return res.status(400).json({ error: "You already have a pending payout request. Wait for it to be reviewed." });

    const request = await PayoutRequest.create({
      userId: req.user._id,
      email: req.user.email,
      name: req.user.name,
      amount: value,
      method: mode,
      destination: target,
      note: text(body.note).slice(0, 300),
    });

    res.status(201).json({ request: publicPayout(request), balance: Number(req.user.points) || 0 });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ error: "You already have a pending payout request." });
    }
    isServerError(res, e);
  }
};

exports.updatePayout = async (req, res) => {
  try {
    const status = String((req.body || {}).status || "").toLowerCase();
    if (!["approved", "rejected"].includes(status))
      return res.status(400).json({ error: "status must be approved or rejected" });
    if (!isValidId(req.params.id)) return res.status(400).json({ error: "Invalid payout id" });

    const adminNote = String((req.body || {}).adminNote || "").slice(0, 300);
    const claimed = await PayoutRequest.findOneAndUpdate(
      { _id: req.params.id, status: "pending" },
      { $set: { status, adminNote, reviewedBy: req.user.email, reviewedAt: new Date() } },
      { new: true },
    );
    if (!claimed) return res.status(409).json({ error: "This payout is no longer pending" });

    if (status === "approved") {
      const fresh = await userdetail.findOneAndUpdate(
        { _id: claimed.userId, points: { $gte: claimed.amount } },
        { $inc: { points: -claimed.amount } },
        { new: true },
      );
      if (!fresh) {
        await PayoutRequest.updateOne(
          { _id: claimed._id },
          { $set: { status: "pending", adminNote: "", reviewedBy: "", reviewedAt: null } },
        );
        return res.status(400).json({ error: "That member no longer has enough points for this payout" });
      }
      await transaction.create({
        amount: claimed.amount,
        from: fresh.email,
        to: "Payout",
        type: "payout",
      });
    }

    res.json({ request: publicPayout(claimed) });
  } catch (e) {
    isServerError(res, e);
  }
};

/* ---------------- Users ---------------- */

exports.listUsers = async (req, res) => {
  const me = req.user;
  const filter = roleOf(me) === "admin" ? {} : { referredBy: me.referralCode };
  const users = await userdetail.find(filter).sort({ _id: 1 }).lean();
  res.json({ users: users.map(publicUser), role: roleOf(me) });
};

exports.updateUser = async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: "Invalid user id" });
  const target = await userdetail.findById(req.params.id);
  if (!target) return res.status(404).json({ error: "User not found" });

  const { name, email, mobile, role, isFounder } = req.body || {};
  const patch = {};

  if (name !== undefined) {
    const trimmed = text(name);
    if (trimmed.length < 2 || trimmed.length > 80) {
      return res.status(400).json({ error: "Name must be between 2 and 80 characters" });
    }
    patch.name = trimmed;
  }

  if (mobile !== undefined) {
    if (mobile === "" || mobile === null) patch.mobile = null;
    else {
      if (!isPhone(mobile)) return res.status(400).json({ error: "Enter a valid mobile number" });
      patch.mobile = Number(String(mobile).replace(/\D/g, ""));
    }
  }

  if (role !== undefined) {
    if (!["admin", "user"].includes(role)) return res.status(400).json({ error: "Invalid role" });
    if (String(target._id) === String(req.user._id) && role !== roleOf(target))
      return res.status(400).json({ error: "You cannot change your own role" });
    patch.role = role;
  }

  if (isFounder !== undefined) patch.isFounder = Boolean(isFounder);

  if (email !== undefined) {
    const nextEmail = normalizeEmail(email);
    if (!isEmail(nextEmail)) return res.status(400).json({ error: "Enter a valid email" });
    if (nextEmail !== String(target.email).toLowerCase()) {
      const duplicate = await userdetail.findOne({
        _id: { $ne: target._id },
        email: nextEmail,
      });
      if (duplicate) return res.status(400).json({ error: "Email already in use" });
      patch.email = nextEmail;
      await transaction.updateMany({ to: target.email }, { $set: { to: nextEmail } });
      await transaction.updateMany({ from: target.email }, { $set: { from: nextEmail } });
    }
  }

  const fresh = await userdetail.findByIdAndUpdate(target._id, { $set: patch }, { new: true });
  res.json({ user: publicUser(fresh) });
};

exports.resetUserPassword = async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: "Invalid user id" });
  const target = await userdetail.findById(req.params.id);
  if (!target) return res.status(404).json({ error: "User not found" });

  const tempPassword = `Tmp-${crypto.randomBytes(5).toString("hex")}`;
  const hashed = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);
  await userdetail.updateOne(
    { _id: target._id },
    {
      $set: {
        pass: hashed,
        auth_key: "",
        resetTokenHash: "",
        resetTokenExpires: null,
      },
    },
  );
  res.json({ ok: true, tempPassword });
};

exports.deleteUser = async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: "Invalid user id" });
  if (String(req.params.id) === String(req.user._id))
    return res.status(400).json({ error: "You cannot delete yourself" });
  const r = await userdetail.deleteOne({ _id: req.params.id });
  if (!r.deletedCount) return res.status(404).json({ error: "User not found" });
  res.json({ ok: true });
};

exports.adjustPoints = async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: "Invalid user id" });
  const { points, type } = req.body || {};
  const amount = Number(points);
  if (!isSafePoints(amount) || amount <= 0) return res.status(400).json({ error: "Invalid points" });
  if (!["credit", "debit"].includes(type)) return res.status(400).json({ error: "type must be credit or debit" });
  const target = await userdetail.findById(req.params.id);
  if (!target) return res.status(404).json({ error: "User not found" });
  if (type === "debit" && target.points < amount)
    return res.status(400).json({ error: "Insufficient balance to debit" });
  const delta = type === "credit" ? amount : -amount;
  await userdetail.updateOne({ _id: target._id }, { $inc: { points: delta } });
  await transaction.create({ amount, from: "admin", to: target.email, type: `admin ${type}` });
  const fresh = await userdetail.findById(target._id);
  res.json({ user: publicUser(fresh) });
};

/* ---------------- Profile ---------------- */

exports.updateProfile = async (req, res) => {
  const { name, email, mobile, Id } = req.body || {};
  const patch = {};
  if (name !== undefined) {
    const trimmed = text(name);
    if (trimmed.length < 2 || trimmed.length > 80) {
      return res.status(400).json({ error: "Name must be between 2 and 80 characters" });
    }
    patch.name = trimmed;
  }
  if (mobile !== undefined) {
    if (mobile === "" || mobile === null) patch.mobile = null;
    else {
      if (!isPhone(mobile)) return res.status(400).json({ error: "Enter a valid mobile number" });
      patch.mobile = Number(String(mobile).replace(/\D/g, ""));
    }
  }
  if (Id !== undefined) {
    if (Id === "" || Id === null) patch.Id = null;
    else {
      const num = Number(Id);
      if (!Number.isSafeInteger(num) || num < 0 || num > 1_000_000_000) {
        return res.status(400).json({ error: "User ID must be a valid number" });
      }
      patch.Id = num;
    }
  }
  if (email !== undefined) {
    const nextEmail = normalizeEmail(email);
    if (!isEmail(nextEmail)) return res.status(400).json({ error: "Enter a valid email" });
    if (nextEmail !== String(req.user.email).toLowerCase()) {
      const duplicate = await userdetail.findOne({ _id: { $ne: req.user._id }, email: nextEmail });
      if (duplicate) return res.status(400).json({ error: "Email already in use" });
      patch.email = nextEmail;
      await transaction.updateMany({ to: req.user.email }, { $set: { to: nextEmail } });
      await transaction.updateMany({ from: req.user.email }, { $set: { from: nextEmail } });
    }
  }
  const fresh = await userdetail.findByIdAndUpdate(req.user._id, { $set: patch }, { new: true });
  res.json({ user: publicUser(fresh) });
};

exports.changePassword = async (req, res) => {
  const { oldpass, pass, conpass } = req.body || {};
  if (typeof oldpass !== "string" || !isPassword(pass) || typeof conpass !== "string") {
    return res.status(400).json({ error: "Enter your current password and an 8–128 character new password" });
  }
  if (pass !== conpass) return res.status(400).json({ error: "New passwords do not match" });
  if (oldpass === pass) return res.status(400).json({ error: "New password is the same as the old one" });
  const me = await userdetail.findById(req.user._id);
  if (!(await bcrypt.compare(oldpass, me.pass))) {
    return res.status(401).json({ error: "Your current password is incorrect" });
  }
  const hashed = await bcrypt.hash(pass, BCRYPT_ROUNDS);
  await userdetail.updateOne({ _id: me._id }, { $set: { pass: hashed, auth_key: "" } });
  res.clearCookie("token", clearCookieOptions());
  res.json({ ok: true, reLogin: true });
};

exports.contactSubmit = async (req, res) => {
  try {
    const body = req.body || {};
    const name = text(body.name);
    const email = normalizeEmail(body.email);
    const message = text(body.message);
    if (name.length < 2 || name.length > 80 || !isEmail(email)) {
      return res.status(400).json({ error: "Enter a valid name and email" });
    }
    if (message.length > 5000) {
      return res.status(400).json({ error: "Message is too long" });
    }
    const nu = await ContactSubmission.create({ name, email, message, status: "new" });
    res.status(201).json({ ok: true, id: nu._id });
  } catch (e) {
    isServerError(res, e);
  }
};

exports.listContactSubmissions = async (req, res) => {
  try {
    const submissions = await ContactSubmission.find({}).sort({ createdAt: -1 }).lean();
    res.json({ submissions: submissions.map(s => ({
      id: s._id,
      name: s.name,
      email: s.email,
      message: s.message,
      status: s.status,
      createdAt: s.createdAt
    })) });
  } catch (e) {
    isServerError(res, e);
  }
};

exports.updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body || {};
    const allowed = ["new", "contacted", "completed"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "status must be new, contacted or completed" });
    }
    if (!/^[a-f\d]{24}$/i.test(String(req.params.id))) {
      return res.status(400).json({ error: "Invalid submission id" });
    }
    const sub = await ContactSubmission.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    );
    if (!sub) return res.status(404).json({ error: "Submission not found" });
    res.json({
      submission: {
        id: sub._id,
        name: sub.name,
        email: sub.email,
        message: sub.message,
        status: sub.status,
        createdAt: sub.createdAt,
      },
    });
  } catch (e) {
    isServerError(res, e);
  }
};
