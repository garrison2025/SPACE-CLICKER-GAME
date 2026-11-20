import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../utils/galaxyUpgrades.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const encoded = Buffer.from(outputText, 'utf8').toString('base64');
const { getUpgradeQuote, getUpgradeBaseOutput, getMilestoneMultiplier } = await import(
  `data:text/javascript;base64,${encoded}`
);

const drill = { count: 1, baseCost: 15, costMultiplier: 1.5, baseProduction: 1 };
assert.deepEqual(getUpgradeQuote(drill, 1), { count: 1, cost: 22 });
assert.deepEqual(getUpgradeQuote(drill, 500, 21), { count: 0, cost: 0 });
assert.deepEqual(getUpgradeQuote(drill, 500, 22), { count: 1, cost: 22 });
assert.deepEqual(getUpgradeQuote(drill, 500, 54), { count: 1, cost: 22 });
assert.deepEqual(getUpgradeQuote(drill, 500, 55), { count: 2, cost: 55 });
assert.deepEqual(getUpgradeQuote({ ...drill, count: 999, costMultiplier: 1 }, 10), { count: 1, cost: 15 });
assert.deepEqual(getUpgradeQuote({ ...drill, count: 1000 }, 10), { count: 0, cost: 0 });

assert.equal(getMilestoneMultiplier(500) / getMilestoneMultiplier(499), 4);
const drone = { ...drill, count: 24, baseProduction: 2 };
assert.equal(getUpgradeBaseOutput(drone, 25) - getUpgradeBaseOutput(drone), 52);

console.log('Galaxy Miner upgrade quotes and milestone checks passed.');
