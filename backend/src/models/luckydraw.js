const mongoose = require("mongoose");

const sch = new mongoose.Schema({
  dayKey: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  drawnAt: {
    type: Date,
    default: Date.now,
  },
  drawnBy: {
    type: String,
    default: "",
  },
  winnerId: {
    type: String,
    default: "",
  },
  winnerName: {
    type: String,
    default: "",
  },
  winnerEmail: {
    type: String,
    default: "",
  },
  prize: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("luckydraw", sch);
