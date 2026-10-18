import test from "node:test";
import assert from "node:assert/strict";
import { calculateReward } from "../config/rewards.js";

test("reward calculation applies configured category rates and rounds final total", () => {
  const result = calculateReward({ paper: 3.5, cardboard: 2, metal: 0.5 });
  assert.equal(result.points, 59);
  assert.deepEqual(result.detail.map(x => x.points), [35, 16, 7.5]);
});

test("unknown category has zero rate rather than granting arbitrary points", () => {
  const result = calculateReward({ untrustedCategory: 12 });
  assert.equal(result.points, 0);
  assert.equal(result.detail[0].rate, 0);
});

test("empty weight set earns zero points", () => {
  assert.deepEqual(calculateReward({}), { detail: [], points: 0 });
});
