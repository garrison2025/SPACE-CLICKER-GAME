import type { Upgrade } from '../types';

export const MAX_GALAXY_UPGRADE_COUNT = 1000;

export const GALAXY_UPGRADE_MILESTONES = [
  { level: 25, multiplier: 2 },
  { level: 50, multiplier: 2 },
  { level: 100, multiplier: 2 },
  { level: 200, multiplier: 2 },
  { level: 500, multiplier: 4 },
];

export function getMilestoneMultiplier(count: number): number {
  let multiplier = 1;
  for (const milestone of GALAXY_UPGRADE_MILESTONES) {
    if (count < milestone.level) break;
    multiplier *= milestone.multiplier;
  }
  return multiplier;
}

export function getUpgradeBaseOutput(upgrade: Upgrade, count = upgrade.count): number {
  return upgrade.baseProduction * count * getMilestoneMultiplier(count);
}

export function getUpgradeQuote(upgrade: Upgrade, requestedCount: number, budget = Infinity) {
  const limit = Math.min(Math.floor(requestedCount), MAX_GALAXY_UPGRADE_COUNT - upgrade.count);
  let count = 0;
  let cost = 0;
  while (count < limit) {
    const unitCost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.count + count));
    if (cost + unitCost > budget) break;
    cost += unitCost;
    count++;
  }
  return { count, cost };
}
