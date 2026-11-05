const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "usersdetail", required: true },
  email: { type: String, required: true },
  name: { type: String, default: "" },
  amount: { type: Number, required: true, min: 1 },
  method: { type: String, enum: ["upi", "bank", "paypal"], default: "upi" },
  destination: { type: String, required: true },
  note: { type: String, default: "" },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
  adminNote: { type: String, default: "" },
  reviewedBy: { type: String, default: "" },
  reviewedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

schema.index({ status: 1, createdAt: -1 });
schema.index(
  { userId: 1 },
  {
    name: "pending_payout_per_user",
    unique: true,
    partialFilterExpression: { status: "pending" },
  },
);

module.exports = mongoose.model("payoutrequest", schema);
