const userdetail = require("../models/userdetail");

// BFS find next free slot under a sponsor for ternary tree.
// Returns { parentDoc, position } where parentDoc can hold one more child.
async function findPlacement(sponsorCode) {
  const sponsor = await userdetail.findOne({ referralCode: sponsorCode });
  if (!sponsor) throw new Error("Invalid referral code");

  const queue = [sponsor];
  while (queue.length) {
    const node = queue.shift();
    const children = await userdetail
      .find({ referredBy: node.referralCode })
      .sort({ _id: 1 });
    const used = new Set(children.map((c) => c.position));
    for (const leg of ["LEFT", "MIDDLE", "RIGHT"]) {
      if (!used.has(leg)) return { parentDoc: node, position: leg };
    }
    queue.push(...children);
  }
  throw new Error("Tree is full under this sponsor");
}

async function getDirectChildren(referralCode) {
  return userdetail.find({ referredBy: referralCode }).sort({ _id: 1 });
}

// Build nested tree up to depth (default 5) for visualisation.
async function buildTree(referralCode, depth = 5) {
  const root = await userdetail.findOne({ referralCode }).lean();
  if (!root) return null;
  async function fill(node, d) {
    if (d <= 0) {
      node.children = [];
      return node;
    }
    const kids = await userdetail.find({ referredBy: node.referralCode }).lean();
    // order LEFT, MIDDLE, RIGHT
    const order = { LEFT: 0, MIDDLE: 1, RIGHT: 2, ROOT: 3 };
    kids.sort((a, b) => (order[a.position] ?? 9) - (order[b.position] ?? 9));
    node.children = [];
    for (const k of kids) node.children.push(await fill(k, d - 1));
    return node;
  }
  return fill(root, depth);
}

async function countDownline(referralCode) {
  let count = 0;
  const queue = [referralCode];
  while (queue.length) {
    const code = queue.shift();
    const kids = await userdetail.find({ referredBy: code }, { referralCode: 1 });
    count += kids.length;
    queue.push(...kids.map((k) => k.referralCode));
  }
  return count;
}

module.exports = { findPlacement, getDirectChildren, buildTree, countDownline };
