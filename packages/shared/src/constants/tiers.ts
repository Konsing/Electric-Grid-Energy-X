export interface EnergyTier {
  maxKwh: number;    // Upper bound (inclusive) — Infinity for last tier
  ratePerKwh: number; // Price in dollars per kWh
}

export const ENERGY_TIERS: EnergyTier[] = [
  { maxKwh: 500,      ratePerKwh: 0.08 },  // Tier 1: 0–500 kWh
  { maxKwh: 1000,     ratePerKwh: 0.12 },  // Tier 2: 501–1000 kWh
  { maxKwh: Infinity, ratePerKwh: 0.15 },  // Tier 3: 1001+ kWh
];

export const BASE_SERVICE_CHARGE = 12.50; // Monthly fixed charge
