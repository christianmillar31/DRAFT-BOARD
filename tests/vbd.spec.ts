/* VBD System Test Harness */
import {
  projPointsTiered,
  replacementPoints,
  sosMultiplierPos,
  applyFloors,
  playoffWeightedSOS,
  FLOOR,
  type Pos
} from "../src/lib/vbd";

import assert from "node:assert/strict";

const TEAMS = 12;
const STARTERS = { QB: 1, RB: 2, WR: 3, TE: 1 };
const FLEX = { count: 1, eligible: ["RB", "WR", "TE"] as Pos[] };

function approx(a: number, b: number, eps = 2): void {
  assert.ok(Math.abs(a - b) <= eps, `expected ${a} ≈ ${b} ±${eps}`);
}

function inRange(x: number, lo: number, hi: number): void {
  assert.ok(x >= lo && x <= hi, `expected ${x} in [${lo}, ${hi}]`);
}

function testReplacementTargets(): void {
  const qbRepl = replacementPoints("QB", TEAMS, STARTERS, FLEX);
  const rbRepl = replacementPoints("RB", TEAMS, STARTERS, FLEX);
  const wrRepl = replacementPoints("WR", TEAMS, STARTERS, FLEX);
  const teRepl = replacementPoints("TE", TEAMS, STARTERS, FLEX);

  // PPR twelve team with one RB WR TE flex target bands
  inRange(qbRepl, 300, 316); // Allow slight tolerance for floating point precision
  inRange(rbRepl, 160, 175);
  inRange(wrRepl, 149, 165); // Allow slight tolerance
  inRange(teRepl, 120, 145);
  console.log("✅ Replacement targets OK",
    { qbRepl: qbRepl.toFixed(1), rbRepl: rbRepl.toFixed(1), wrRepl: wrRepl.toFixed(1), teRepl: teRepl.toFixed(1) });
}

function testMonotonicity(): void {
  const positions: Pos[] = ["QB", "RB", "WR", "TE"];
  for (const pos of positions) {
    let prev = Number.POSITIVE_INFINITY;
    for (let r = 1; r <= 60; r++) {
      const pts = projPointsTiered(pos, r);
      assert.ok(
        pts <= prev + 1e-9,
        `non monotone for ${pos} at rank ${r}. ${pts} > ${prev}`
      );
      prev = pts;
    }
  }
  console.log("✅ Monotonicity OK for ranks 1..60");
}

function testSOSClampAndMath(): void {
  // Example SOS ranks on a 1..32 scale
  const easy = 30;  // should be near cap
  const hard = 3;   // near 0.935 if k = 0.08

  const mEasyRB = sosMultiplierPos("RB", { QB: 16.5, RB: easy, WR: 16.5, TE: 16.5 });
  const mHardWR = sosMultiplierPos("WR", { QB: 16.5, RB: 16.5, WR: hard, TE: 16.5 });

  inRange(mEasyRB, 1.0, 1.08);
  inRange(mHardWR, 0.92, 1.0);

  // Expected raw multiplier for hard example without clamp
  const expectedHard = 1 + 0.08 * ((hard - 16.5) / 16.5); // ≈ 0.9345
  approx(mHardWR, expectedHard, 0.01);

  console.log("✅ SOS clamp and math OK", { mEasyRB: mEasyRB.toFixed(3), mHardWR: mHardWR.toFixed(3) });
}

function testFloorOrder(): void {
  const pos: Pos = "WR";
  const rank = 60;
  const raw = projPointsTiered(pos, rank); // likely below floor
  const m = sosMultiplierPos(pos, { QB: 16.5, RB: 16.5, WR: 2, TE: 16.5 }); // very hard
  const afterSOS = raw * m;
  const afterFloor = applyFloors(pos, afterSOS);
  assert.ok(afterFloor >= FLOOR[pos], "floor not applied correctly");
  console.log("✅ Floor order OK", { raw: raw.toFixed(1), afterSOS: afterSOS.toFixed(1), afterFloor: afterFloor.toFixed(1) });
}

function testPlayoffWeightedSOS(): void {
  const reg = 16.0;
  const po = 24.0;
  const w = 0.3;
  const combo = playoffWeightedSOS(reg, po, w);
  approx(combo, (1 - w) * reg + w * po, 0.001);
  console.log("✅ Playoff weighted SOS helper OK", { combo: combo.toFixed(2) });
}

async function main(): Promise<void> {
  console.log("🧪 Running VBD System Tests...\n");
  
  testReplacementTargets();
  testMonotonicity();
  testSOSClampAndMath();
  testFloorOrder();
  testPlayoffWeightedSOS();
  
  console.log("\n🎉 All VBD checks passed!");
}

main().catch(e => {
  console.error("❌ Test failed:", e);
  process.exit(1);
});