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

const saveSource = fs.readFileSync(new URL('../utils/galaxySave.ts', import.meta.url), 'utf8');
const saveScript = ts.transpileModule(saveSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { isGalaxyMinerBackup } = await import(
  `data:text/javascript;base64,${Buffer.from(saveScript, 'utf8').toString('base64')}`
);
const tiers = [{ id: 'click_booster' }, { id: 'drone' }];
const legacy = { resources: { STARDUST: '15' }, upgrades: { drone: { count: '2' } }, planetIndex: 0, lifetimeEarnings: 100 };
const current = {
  ...legacy,
  version: 3,
  resources: { STARDUST: 0, DARK_MATTER: 0 },
  upgrades: { click_booster: { count: 0 }, drone: { count: 0 } },
  lifetimeEarnings: 0,
};
assert.equal(isGalaxyMinerBackup(legacy, tiers), true);
assert.equal(isGalaxyMinerBackup(current, tiers), true);
assert.equal(isGalaxyMinerBackup({ resources: {}, upgrades: {}, planetIndex: 0, lifetimeEarnings: 0 }, tiers), false);
assert.equal(isGalaxyMinerBackup({ ...current, resources: { STARDUST: null } }, tiers), false);
assert.equal(isGalaxyMinerBackup({ ...current, planetIndex: false }, tiers), false);
assert.equal(isGalaxyMinerBackup({ ...current, upgrades: { microBot: { count: 2 } } }, tiers), false);
assert.equal(isGalaxyMinerBackup({ ...current, upgrades: { drone: { count: 2 }, click_booster: {} } }, tiers), false);

console.log('Galaxy Miner upgrade and backup validation checks passed.');
