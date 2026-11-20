type UpgradeTier = { id: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isSaveNumber(value: unknown, integer = false): boolean {
  if (typeof value !== 'number' && (typeof value !== 'string' || value.trim() === '')) return false;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && (!integer || Number.isInteger(number));
}

export function isGalaxyMinerBackup(value: unknown, upgradeTiers: readonly UpgradeTier[]): boolean {
  if (!isRecord(value) || !isRecord(value.resources) || !isRecord(value.upgrades)) return false;
  const { resources, upgrades } = value;

  if (
    !isSaveNumber(resources.STARDUST) ||
    (resources.DARK_MATTER !== undefined && !isSaveNumber(resources.DARK_MATTER)) ||
    !isSaveNumber(value.planetIndex, true) ||
    !isSaveNumber(value.lifetimeEarnings)
  ) return false;

  let hasKnownTier = false;
  for (const { id } of upgradeTiers) {
    if (!Object.prototype.hasOwnProperty.call(upgrades, id)) continue;
    const tier = upgrades[id];
    if (!isRecord(tier) || !isSaveNumber(tier.count, true)) return false;
    hasKnownTier = true;
  }
  return hasKnownTier;
}
