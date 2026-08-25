/**
 * Piano wire: gauge to diameter, string tension, and how close a string sits to
 * its breaking load. Pure functions — no React, no I/O.
 */

export interface WireSize {
  /** Numeric gauge; half sizes are .5, e.g. 13.5 */
  gauge: number;
  /** Display label, e.g. "13½" */
  label: string;
  mm: number;
}

/**
 * Music Wire Gauge (MWG) table for piano wire.
 *
 * Source: Fletcher & Newman piano wire gauge chart, retrieved 2026-08-24.
 * https://www.fletcher-newman.co.uk/index.php?l=page_view&p=piano_wire_gauge
 *
 * Within gauges 12 to 22 the table follows exactly
 *     mm = 0.725 + (gauge - 12) * 0.05
 * with half gauges stepping 0.025 mm. Outside that range the series is
 * irregular — gauge 11 is 0.660 (not 0.675) and gauge 23 is 1.300 (not 1.275) —
 * so THIS TABLE, not the formula, is authoritative. `linearGaugeToMm` exists to
 * document the relation, and the tests verify it against the table.
 *
 * Inches are computed from mm rather than transcribed: the source chart rounds
 * them to three decimals (gauge 12 is listed as 0.028 in, but is 0.02854 in).
 */
export const PIANO_WIRE_SIZES: WireSize[] = [
  { gauge: -0.5, label: '00', mm: 0.2 },
  { gauge: 0, label: '0', mm: 0.23 },
  { gauge: 1, label: '1', mm: 0.254 },
  { gauge: 2, label: '2', mm: 0.28 },
  { gauge: 3, label: '3', mm: 0.305 },
  { gauge: 4, label: '4', mm: 0.33 },
  { gauge: 5, label: '5', mm: 0.36 },
  { gauge: 6, label: '6', mm: 0.41 },
  { gauge: 7, label: '7', mm: 0.46 },
  { gauge: 8, label: '8', mm: 0.51 },
  { gauge: 9, label: '9', mm: 0.56 },
  { gauge: 10, label: '10', mm: 0.61 },
  { gauge: 11, label: '11', mm: 0.66 },
  { gauge: 12, label: '12', mm: 0.725 },
  { gauge: 13, label: '13', mm: 0.775 },
  { gauge: 13.5, label: '13½', mm: 0.8 },
  { gauge: 14, label: '14', mm: 0.825 },
  { gauge: 14.5, label: '14½', mm: 0.85 },
  { gauge: 15, label: '15', mm: 0.875 },
  { gauge: 15.5, label: '15½', mm: 0.9 },
  { gauge: 16, label: '16', mm: 0.925 },
  { gauge: 16.5, label: '16½', mm: 0.95 },
  { gauge: 17, label: '17', mm: 0.975 },
  { gauge: 17.5, label: '17½', mm: 1.0 },
  { gauge: 18, label: '18', mm: 1.025 },
  { gauge: 18.5, label: '18½', mm: 1.05 },
  { gauge: 19, label: '19', mm: 1.075 },
  { gauge: 19.5, label: '19½', mm: 1.1 },
  { gauge: 20, label: '20', mm: 1.125 },
  { gauge: 20.5, label: '20½', mm: 1.15 },
  { gauge: 21, label: '21', mm: 1.175 },
  { gauge: 21.5, label: '21½', mm: 1.2 },
  { gauge: 22, label: '22', mm: 1.225 },
  { gauge: 23, label: '23', mm: 1.3 },
  { gauge: 24, label: '24', mm: 1.4 },
  { gauge: 25, label: '25', mm: 1.5 },
  { gauge: 26, label: '26', mm: 1.6 },
  { gauge: 27, label: '27', mm: 1.7 },
  { gauge: 28, label: '28', mm: 1.8 },
];

/** The range over which `linearGaugeToMm` matches the table exactly. */
export const LINEAR_GAUGE_RANGE = { min: 12, max: 22 } as const;

/**
 * The linear gauge relation. Valid ONLY within `LINEAR_GAUGE_RANGE` — use
 * `gaugeToMm` for real lookups.
 */
export function linearGaugeToMm(gauge: number): number {
  return 0.725 + (gauge - 12) * 0.05;
}

/** Table lookup. Returns null for a gauge that is not a listed size. */
export function gaugeToMm(gauge: number): number | null {
  const hit = PIANO_WIRE_SIZES.find(s => s.gauge === gauge);
  return hit ? hit.mm : null;
}

export interface NearestGauge {
  size: WireSize;
  /** Measured minus table, in mm. Positive means the wire is thicker than the gauge. */
  deltaMm: number;
}

/** The closest listed gauge to a measured diameter. */
export function mmToNearestGauge(mm: number): NearestGauge | null {
  if (!Number.isFinite(mm) || mm <= 0) return null;
  let best = PIANO_WIRE_SIZES[0];
  for (const size of PIANO_WIRE_SIZES) {
    if (Math.abs(size.mm - mm) < Math.abs(best.mm - mm)) best = size;
  }
  return { size: best, deltaMm: mm - best.mm };
}

export function mmToInches(mm: number): number {
  return mm / 25.4;
}

export function inchesToMm(inches: number): number {
  return inches * 25.4;
}

// ── Tension ─────────────────────────────────────────────────────────────────

/** Density of steel music wire, kg/m³. */
export const STEEL_DENSITY_KG_M3 = 7850;

const NEWTONS_PER_KGF = 9.80665;
const LBF_PER_NEWTON = 0.224808943;

/** Linear mass density, kg/m: rho * pi * (d/2)^2. */
export function linearDensity(diameterMm: number): number {
  const radiusM = diameterMm / 1000 / 2;
  return STEEL_DENSITY_KG_M3 * Math.PI * radiusM * radiusM;
}

/**
 * Mersenne's law rearranged for tension:
 *   f = (1 / 2L) * sqrt(T / mu)   =>   T = 4 * L^2 * f^2 * mu
 * with L in metres and mu in kg/m, giving T in newtons.
 */
export function stringTensionNewtons(
  diameterMm: number,
  speakingLengthMm: number,
  frequencyHz: number,
): number {
  const lengthM = speakingLengthMm / 1000;
  return 4 * lengthM * lengthM * frequencyHz * frequencyHz * linearDensity(diameterMm);
}

export function newtonsToKgf(n: number): number {
  return n / NEWTONS_PER_KGF;
}

export function newtonsToLbf(n: number): number {
  return n * LBF_PER_NEWTON;
}

/**
 * ULTIMATE TENSILE STRENGTH — A DOCUMENTED MODEL, NOT A GUARANTEE
 *
 * Music wire is cold-drawn, so its UTS falls as diameter rises: thinner wire
 * has seen more drawing reduction and comes out stronger. Published figures for
 * piano music wire span roughly 2000-2700 MPa across the usual 0.725-2.0 mm
 * range (music wire generally is quoted at 230-399 ksi, about 1590-2750 MPa,
 * depending on diameter; Paulello quotes 1700-2200 N/mm^2 for Type 0 and
 * 1200-1900 for Type 1, both varying with diameter).
 *
 * We interpolate piecewise-linearly over the anchors below and clamp at both
 * ends. Real UTS varies by brand, batch and age, and an old string in a piano
 * may sit well below spec — so the "percent of breaking load" figure this feeds
 * is an ORDER-OF-MAGNITUDE GUIDE, not a safety limit.
 *
 * Terminology note: technicians say "percent of breaking strain", but what is
 * computed here is percent of breaking *load* — tensile stress (T/A) over UTS.
 * Strain (elongation) is not modelled.
 */
const UTS_ANCHORS: { mm: number; mpa: number }[] = [
  { mm: 0.725, mpa: 2650 },
  { mm: 1.0, mpa: 2500 },
  { mm: 1.3, mpa: 2350 },
  { mm: 1.6, mpa: 2250 },
  { mm: 2.0, mpa: 2150 },
];

/** Human-readable description of the strength model, for display in the UI. */
export const UTS_MODEL_LABEL =
  'Piecewise-linear fit, 2650 to 2150 MPa over 0.725-2.0 mm';

/** Modelled ultimate tensile strength at a given diameter, in MPa. */
export function tensileStrengthMPa(diameterMm: number): number {
  const first = UTS_ANCHORS[0];
  const last = UTS_ANCHORS[UTS_ANCHORS.length - 1];
  if (diameterMm <= first.mm) return first.mpa;
  if (diameterMm >= last.mm) return last.mpa;

  for (let i = 0; i < UTS_ANCHORS.length - 1; i++) {
    const a = UTS_ANCHORS[i];
    const b = UTS_ANCHORS[i + 1];
    if (diameterMm <= b.mm) {
      const t = (diameterMm - a.mm) / (b.mm - a.mm);
      return a.mpa + t * (b.mpa - a.mpa);
    }
  }
  return last.mpa;
}

/** Cross-sectional area in m². */
function areaM2(diameterMm: number): number {
  const radiusM = diameterMm / 1000 / 2;
  return Math.PI * radiusM * radiusM;
}

/** Modelled load at which the wire breaks, in newtons. */
export function breakingLoadNewtons(diameterMm: number): number {
  return tensileStrengthMPa(diameterMm) * 1e6 * areaM2(diameterMm);
}

export type TensionBand = 'safe' | 'elevated' | 'high' | 'danger';

/**
 * Percent-of-breaking-load thresholds.
 *
 * Sources disagree on what counts as "normal", so these are anchored on the one
 * figure with a defensible engineering basis: below roughly 60% of UTS, stress
 * relaxation happens in the rest of the system rather than in the wire itself.
 * General guidance for steel strings puts working tension around 20-35% of
 * maximum tensile strength, and with the UTS model above a real piano string
 * computes to roughly 30-45% — so `safe` covers the normal case comfortably.
 *
 * Deliberately NOT anchored on the widely-repeated "piano strings sit at 55-65%
 * of breaking" claim, which we could not source.
 */
export const RELAXATION_THRESHOLD_PERCENT = 60;

export interface TensionResult {
  tensionN: number;
  tensionKgf: number;
  tensionLbf: number;
  stressMPa: number;
  utsMPa: number;
  percentOfBreaking: number;
  band: TensionBand;
}

function bandFor(percent: number): TensionBand {
  if (percent < RELAXATION_THRESHOLD_PERCENT) return 'safe';
  if (percent < 80) return 'elevated';
  if (percent < 90) return 'high';
  return 'danger';
}

/** Full tension analysis for one string, or null for any non-positive input. */
export function analyzeString(input: {
  diameterMm: number;
  speakingLengthMm: number;
  frequencyHz: number;
}): TensionResult | null {
  const { diameterMm, speakingLengthMm, frequencyHz } = input;
  const valid = [diameterMm, speakingLengthMm, frequencyHz].every(
    v => Number.isFinite(v) && v > 0,
  );
  if (!valid) return null;

  const tensionN = stringTensionNewtons(diameterMm, speakingLengthMm, frequencyHz);
  const utsMPa = tensileStrengthMPa(diameterMm);
  const stressMPa = tensionN / areaM2(diameterMm) / 1e6;
  const percentOfBreaking = (stressMPa / utsMPa) * 100;

  return {
    tensionN,
    tensionKgf: newtonsToKgf(tensionN),
    tensionLbf: newtonsToLbf(tensionN),
    stressMPa,
    utsMPa,
    percentOfBreaking,
    band: bandFor(percentOfBreaking),
  };
}
