const crypto = require("crypto");

const PRIZES = [
  { value: 5, weight: 22 },
  { value: 10, weight: 22 },
  { value: 20, weight: 18 },
  { value: 25, weight: 14 },
  { value: 50, weight: 10 },
  { value: 75, weight: 7 },
  { value: 100, weight: 5 },
  { value: 250, weight: 2 },
];

const TOTAL_WEIGHT = PRIZES.reduce((sum, prize) => sum + prize.weight, 0);

function pickPrize() {
  let roll = crypto.randomInt(TOTAL_WEIGHT);
  for (const prize of PRIZES) {
    if (roll < prize.weight) return prize.value;
    roll -= prize.weight;
  }
  return PRIZES[0].value;
}

function dayKey(date = new Date()) {
  const tz = process.env.LUCKY_DRAW_TZ || "Asia/Kolkata";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

module.exports = { PRIZES, pickPrize, dayKey };
