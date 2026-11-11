// Payment reconciliation.
//
// Reads payments.jsonl and works out how much money we actually collected.
// Run:  node reconcile.js

const fs = require("fs");

function parseAmount(val) {
  if (typeof val === "number") return val;
  if (typeof val === "string") return Number(val.replace(/,/g, ""));
  return Number(val);
}

const latestPayments = new Map();

const lines = fs.readFileSync("payments.jsonl", "utf8").split("\n");
for (const line of lines) {
  if (!line.trim()) continue;

  let event;
  try {
    event = JSON.parse(line);
  } catch {
    continue;
  }

  if (!event || typeof event !== "object" || !event.txn_id) {
    continue;
  }

  const prev = latestPayments.get(event.txn_id);
  if (!prev || new Date(event.ts) > new Date(prev.ts)) {
    latestPayments.set(event.txn_id, event);
  }
}

let total = 0;
let count = 0;

for (const event of latestPayments.values()) {
  if (event.status === "success") {
    total += parseAmount(event.amount);
    count += 1;
  }
}

const expected = parseInt(fs.readFileSync("expected.txt", "utf8").trim(), 10);

if (count !== expected) {
  console.log(`Check failed: counted ${count} successful payments, expected ${expected}.`);
  console.log("Something in the data isn't being handled the way the README describes.");
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}
