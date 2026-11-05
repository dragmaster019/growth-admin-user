const userdetail = require("../models/userdetail");
const transaction = require("../models/transaction");

const JOIN_COMMISSION = 50;

async function creditJoinCommission(newUser) {
  let code = newUser.referredBy;
  const seen = new Set();
  while (code && !seen.has(code)) {
    seen.add(code);
    const up = await userdetail.findOne({ referralCode: code });
    if (!up) break;
    await userdetail.updateOne({ _id: up._id }, { $inc: { points: JOIN_COMMISSION } });
    await transaction.create({
      amount: JOIN_COMMISSION,
      from: newUser.email,
      to: up.email,
      type: "new registration",
    });
    code = up.referredBy;
  }
}

module.exports = { JOIN_COMMISSION, creditJoinCommission };
