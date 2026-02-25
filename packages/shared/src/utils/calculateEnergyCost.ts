import { ENERGY_TIERS, BASE_SERVICE_CHARGE } from '../constants/tiers';

/**
 * Calculates the total energy cost using tiered pricing.
 * Each tier applies its rate only to the kWh within that tier's range.
 *
 * Example: 600 kWh
 *   Tier 1: 500 kWh × $0.08 = $40.00
 *   Tier 2: 100 kWh × $0.12 = $12.00
 *   Base charge: $12.50
 *   Total: $64.50
 */
export function calculateEnergyCost(totalKwh: number): number {
  if (totalKwh < 0) {
    throw new Error('totalKwh must be non-negative');
  }

  if (totalKwh === 0) {
    return BASE_SERVICE_CHARGE;
  }

  let remaining = totalKwh;
  let cost = BASE_SERVICE_CHARGE;
  let previousMax = 0;

  for (const tier of ENERGY_TIERS) {
    if (remaining <= 0) break;

    const tierRange = tier.maxKwh === Infinity
      ? remaining
      : tier.maxKwh - previousMax;

    const kwhInTier = Math.min(remaining, tierRange);
    cost += kwhInTier * tier.ratePerKwh;
    remaining -= kwhInTier;
    previousMax = tier.maxKwh === Infinity ? previousMax : tier.maxKwh;
  }

  return Math.round(cost * 100) / 100; // Round to cents
}
