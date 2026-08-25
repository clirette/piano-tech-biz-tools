import { describe, it, expect } from 'vitest';
import {
  PIANO_WIRE_SIZES,
  LINEAR_GAUGE_RANGE,
  linearGaugeToMm,
  gaugeToMm,
  mmToNearestGauge,
  mmToInches,
  inchesToMm,
  linearDensity,
  stringTensionNewtons,
  newtonsToKgf,
  newtonsToLbf,
  tensileStrengthMPa,
  breakingLoadNewtons,
  analyzeString,
  STEEL_DENSITY_KG_M3,
} from '../pianoWire';

describe('wire gauge table', () => {
  it('matches the linear relation exactly for gauges 12-22', () => {
    const inRange = PIANO_WIRE_SIZES.filter(
      s => s.gauge >= LINEAR_GAUGE_RANGE.min && s.gauge <= LINEAR_GAUGE_RANGE.max,
    );
    expect(inRange.length).toBeGreaterThan(10);
    for (const size of inRange) {
      expect(linearGaugeToMm(size.gauge)).toBeCloseTo(size.mm, 9);
    }
  });

  it('DISAGREES with the linear relation outside 12-22', () => {
    // Regression guard: the formula circulates as if universal, but the real
    // chart is irregular at both ends. If someone "simplifies" the table away
    // in favour of the formula, these break.
    expect(gaugeToMm(23)).toBe(1.3);
    expect(linearGaugeToMm(23)).toBeCloseTo(1.275, 9);

    expect(gaugeToMm(11)).toBe(0.66);
    expect(linearGaugeToMm(11)).toBeCloseTo(0.675, 9);

    expect(gaugeToMm(24)).toBe(1.4);
    expect(linearGaugeToMm(24)).toBeCloseTo(1.325, 9);
  });

  it('looks up known gauges', () => {
    expect(gaugeToMm(12)).toBe(0.725);
    expect(gaugeToMm(13.5)).toBe(0.8);
    expect(gaugeToMm(18)).toBe(1.025);
    expect(gaugeToMm(22)).toBe(1.225);
  });

  it('returns null for a gauge that is not a listed size', () => {
    expect(gaugeToMm(99)).toBeNull();
    expect(gaugeToMm(12.25)).toBeNull();
  });

  it('is strictly ascending in both gauge and diameter, with no duplicates', () => {
    for (let i = 1; i < PIANO_WIRE_SIZES.length; i++) {
      expect(PIANO_WIRE_SIZES[i].gauge).toBeGreaterThan(PIANO_WIRE_SIZES[i - 1].gauge);
      expect(PIANO_WIRE_SIZES[i].mm).toBeGreaterThan(PIANO_WIRE_SIZES[i - 1].mm);
    }
    const labels = PIANO_WIRE_SIZES.map(s => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('finds the nearest gauge to a measured diameter', () => {
    expect(mmToNearestGauge(0.8)!.size.label).toBe('13½');
    expect(mmToNearestGauge(0.8)!.deltaMm).toBeCloseTo(0, 9);

    const slightlyThick = mmToNearestGauge(0.727)!;
    expect(slightlyThick.size.gauge).toBe(12);
    expect(slightlyThick.deltaMm).toBeCloseTo(0.002, 9);

    const slightlyThin = mmToNearestGauge(0.79)!;
    expect(slightlyThin.size.label).toBe('13½');
    expect(slightlyThin.deltaMm).toBeCloseTo(-0.01, 9);
  });

  it('returns null when a measured diameter is not a positive number', () => {
    expect(mmToNearestGauge(0)).toBeNull();
    expect(mmToNearestGauge(-1)).toBeNull();
    expect(mmToNearestGauge(NaN)).toBeNull();
  });

  it('converts mm and inches', () => {
    expect(mmToInches(25.4)).toBeCloseTo(1, 9);
    expect(inchesToMm(1)).toBeCloseTo(25.4, 9);
    expect(inchesToMm(mmToInches(0.925))).toBeCloseTo(0.925, 9);
    // The source chart rounds this to 0.028 in; we compute the real value.
    expect(mmToInches(0.725)).toBeCloseTo(0.02854, 5);
  });
});

describe('linear density', () => {
  it('matches the closed form', () => {
    expect(linearDensity(1)).toBeCloseTo(STEEL_DENSITY_KG_M3 * Math.PI * 0.0005 ** 2, 12);
  });

  it('quadruples when the diameter doubles', () => {
    expect(linearDensity(2)).toBeCloseTo(linearDensity(1) * 4, 12);
  });
});

describe('stringTensionNewtons', () => {
  // Worked reference case: 1.025 mm wire, 620 mm speaking length, C4.
  const D = 1.025;
  const L = 620;
  const C4 = 261.6255653;

  it('produces a plausible real piano tension', () => {
    const t = stringTensionNewtons(D, L, C4);
    expect(t).toBeCloseTo(681.7, 0);
    expect(newtonsToKgf(t)).toBeCloseTo(69.5, 1);
    expect(newtonsToLbf(t)).toBeCloseTo(153.3, 1);
  });

  // These scaling laws catch a transposed exponent better than any single value.
  it('quadruples when the frequency doubles', () => {
    expect(stringTensionNewtons(D, L, C4 * 2)).toBeCloseTo(
      stringTensionNewtons(D, L, C4) * 4,
      6,
    );
  });

  it('quadruples when the length doubles', () => {
    expect(stringTensionNewtons(D, L * 2, C4)).toBeCloseTo(
      stringTensionNewtons(D, L, C4) * 4,
      6,
    );
  });

  it('quadruples when the diameter doubles', () => {
    expect(stringTensionNewtons(D * 2, L, C4)).toBeCloseTo(
      stringTensionNewtons(D, L, C4) * 4,
      6,
    );
  });

  it('is unchanged when the frequency halves and the length doubles', () => {
    expect(stringTensionNewtons(D, L * 2, C4 / 2)).toBeCloseTo(
      stringTensionNewtons(D, L, C4),
      9,
    );
  });
});

describe('unit conversions', () => {
  it('converts newtons to kgf and lbf', () => {
    expect(newtonsToKgf(9.80665)).toBeCloseTo(1, 12);
    expect(newtonsToLbf(1)).toBeCloseTo(0.2248089, 6);
  });
});

describe('tensileStrengthMPa', () => {
  it('never increases as the wire gets thicker', () => {
    let prev = Infinity;
    for (let mm = 0.5; mm <= 2.2; mm += 0.05) {
      const uts = tensileStrengthMPa(mm);
      expect(uts).toBeLessThanOrEqual(prev + 1e-9);
      prev = uts;
    }
  });

  it('clamps flat outside the anchor range', () => {
    expect(tensileStrengthMPa(0.1)).toBe(tensileStrengthMPa(0.725));
    expect(tensileStrengthMPa(5)).toBe(tensileStrengthMPa(2.0));
  });

  it('interpolates between anchors', () => {
    // Midway between the 1.0 mm (2500) and 1.3 mm (2350) anchors.
    expect(tensileStrengthMPa(1.15)).toBeCloseTo(2425, 6);
  });

  it('stays inside the published envelope for real piano wire', () => {
    for (const size of PIANO_WIRE_SIZES) {
      const uts = tensileStrengthMPa(size.mm);
      expect(uts).toBeGreaterThanOrEqual(2000);
      expect(uts).toBeLessThanOrEqual(2700);
    }
  });

  it('gives a breaking load that scales with area', () => {
    // Same UTS at both ends of the clamp, so load scales purely with area.
    expect(breakingLoadNewtons(4)).toBeCloseTo(breakingLoadNewtons(2) * 4, 6);
  });
});

describe('analyzeString', () => {
  it('puts a realistic mid-range string well inside the safe band', () => {
    // Regression guard: if the UTS anchors are ever changed such that ordinary
    // strings start reading as "high" or "danger", this fails.
    // 1.025 mm at 620 mm speaking length, C4 — about 70 kgf, which lands near
    // a third of the modelled breaking load.
    const r = analyzeString({ diameterMm: 1.025, speakingLengthMm: 620, frequencyHz: 261.6256 })!;
    expect(r.band).toBe('safe');
    expect(r.percentOfBreaking).toBeGreaterThan(25);
    expect(r.percentOfBreaking).toBeLessThan(45);
  });

  it('bands by percent of breaking load', () => {
    const at = (percent: number) => {
      // Solve for the frequency that lands on a given percent of breaking load.
      const d = 1.0;
      const l = 600;
      const uts = tensileStrengthMPa(d);
      const areaM2 = Math.PI * (d / 1000 / 2) ** 2;
      const targetN = (percent / 100) * uts * 1e6 * areaM2;
      const mu = linearDensity(d);
      const hz = Math.sqrt(targetN / (4 * (l / 1000) ** 2 * mu));
      return analyzeString({ diameterMm: d, speakingLengthMm: l, frequencyHz: hz })!;
    };

    expect(at(30).band).toBe('safe');
    expect(at(59.9).band).toBe('safe');
    expect(at(60.1).band).toBe('elevated');
    expect(at(75).band).toBe('elevated');
    expect(at(80.1).band).toBe('high');
    expect(at(89.9).band).toBe('high');
    expect(at(90.1).band).toBe('danger');
    expect(at(120).band).toBe('danger');
  });

  it('reports stress consistently with tension and area', () => {
    const d = 1.0;
    const r = analyzeString({ diameterMm: d, speakingLengthMm: 600, frequencyHz: 300 })!;
    const areaM2 = Math.PI * (d / 1000 / 2) ** 2;
    expect(r.stressMPa).toBeCloseTo(r.tensionN / areaM2 / 1e6, 6);
    expect(r.percentOfBreaking).toBeCloseTo((r.stressMPa / r.utsMPa) * 100, 9);
  });

  it('returns null for any non-positive or non-finite input', () => {
    const base = { diameterMm: 1, speakingLengthMm: 600, frequencyHz: 440 };
    expect(analyzeString({ ...base, diameterMm: 0 })).toBeNull();
    expect(analyzeString({ ...base, speakingLengthMm: 0 })).toBeNull();
    expect(analyzeString({ ...base, frequencyHz: 0 })).toBeNull();
    expect(analyzeString({ ...base, diameterMm: -1 })).toBeNull();
    expect(analyzeString({ ...base, speakingLengthMm: NaN })).toBeNull();
    expect(analyzeString({ ...base, frequencyHz: Infinity })).toBeNull();
  });
});
