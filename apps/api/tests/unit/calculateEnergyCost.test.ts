import { calculateEnergyCost, BASE_SERVICE_CHARGE } from '@egx/shared';

describe('calculateEnergyCost', () => {
  it('returns base charge for 0 kWh', () => {
    const result = calculateEnergyCost(0);
    expect(result).toBe(BASE_SERVICE_CHARGE);
    expect(result).toBe(12.5);
  });

  it('calculates tier 1 only: 500 kWh', () => {
    // BASE_SERVICE_CHARGE + 500 * 0.08 = 12.50 + 40.00 = 52.50
    const result = calculateEnergyCost(500);
    expect(result).toBe(52.5);
  });

  it('calculates crossing into tier 2: 600 kWh', () => {
    // 12.50 + 500*0.08 + 100*0.12 = 12.50 + 40.00 + 12.00 = 64.50
    const result = calculateEnergyCost(600);
    expect(result).toBe(64.5);
  });

  it('calculates crossing into tier 3: 1200 kWh', () => {
    // 12.50 + 500*0.08 + 500*0.12 + 200*0.15
    // = 12.50 + 40.00 + 60.00 + 30.00 = 142.50
    const result = calculateEnergyCost(1200);
    expect(result).toBe(142.5);
  });

  it('handles exact tier boundary: 1000 kWh', () => {
    // 12.50 + 500*0.08 + 500*0.12 = 12.50 + 40.00 + 60.00 = 112.50
    const result = calculateEnergyCost(1000);
    expect(result).toBe(112.5);
  });

  it('handles small usage: 1 kWh', () => {
    // 12.50 + 1*0.08 = 12.58
    const result = calculateEnergyCost(1);
    expect(result).toBe(12.58);
  });

  it('handles fractional kWh: 250.5 kWh', () => {
    // 12.50 + 250.5*0.08 = 12.50 + 20.04 = 32.54
    const result = calculateEnergyCost(250.5);
    expect(result).toBe(32.54);
  });

  it('throws on negative kWh', () => {
    expect(() => calculateEnergyCost(-1)).toThrow('totalKwh must be non-negative');
    expect(() => calculateEnergyCost(-100)).toThrow();
  });
});
