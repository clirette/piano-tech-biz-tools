/**
 * Pitch math for the bench tools: note ⇄ frequency, cents, and the beat rates
 * of tempered intervals. Pure functions — no React, no I/O.
 */

/** Concert pitch most technicians tune to. Some work at 442. */
export const A4_DEFAULT_HZ = 440;

/** MIDI note numbers of the lowest and highest keys on a standard 88-key piano. */
export const PIANO_LOWEST_MIDI = 21; // A0
export const PIANO_HIGHEST_MIDI = 108; // C8

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** Scientific pitch name for a MIDI note, e.g. 60 → "C4". Sharps only. */
export function midiToNoteName(midi: number): string {
  const name = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
}

/** Equal-tempered frequency of a MIDI note: a4 · 2^((midi − 69) / 12). */
export function midiToFrequency(midi: number, a4Hz: number = A4_DEFAULT_HZ): number {
  return a4Hz * Math.pow(2, (midi - 69) / 12);
}

/** Fractional MIDI note for a frequency, or null for a non-positive input. */
export function frequencyToMidi(hz: number, a4Hz: number = A4_DEFAULT_HZ): number | null {
  if (!Number.isFinite(hz) || hz <= 0) return null;
  return 69 + 12 * Math.log2(hz / a4Hz);
}

/** Interval between two frequencies in cents: 1200 · log2(f2 / f1). */
export function centsBetween(f1: number, f2: number): number {
  if (!Number.isFinite(f1) || !Number.isFinite(f2) || f1 <= 0 || f2 <= 0) return NaN;
  return 1200 * Math.log2(f2 / f1);
}

/** Shifts a frequency by a cent offset: f · 2^(cents / 1200). */
export function shiftByCents(hz: number, cents: number): number {
  return hz * Math.pow(2, cents / 1200);
}

export interface NearestNote {
  midi: number;
  name: string;
  /** How far the input sits from that note, in cents. Positive = sharp. */
  centsOff: number;
}

/** The equal-tempered note closest to a frequency, and how far off it is. */
export function nearestNote(hz: number, a4Hz: number = A4_DEFAULT_HZ): NearestNote | null {
  const exact = frequencyToMidi(hz, a4Hz);
  if (exact === null) return null;
  const midi = Math.round(exact);
  return {
    midi,
    name: midiToNoteName(midi),
    centsOff: (exact - midi) * 100,
  };
}

export interface PianoNote {
  midi: number;
  name: string;
  /** 1–88, counting up from A0. */
  pianoKey: number;
}

/** Every key on an 88-key piano, low to high. */
export const PIANO_NOTES: PianoNote[] = Array.from(
  { length: PIANO_HIGHEST_MIDI - PIANO_LOWEST_MIDI + 1 },
  (_, i) => {
    const midi = PIANO_LOWEST_MIDI + i;
    return { midi, name: midiToNoteName(midi), pianoKey: i + 1 };
  },
);

export type IntervalKind = 'M3' | 'P4' | 'P5' | 'M6' | 'M10';

export interface IntervalSpec {
  kind: IntervalKind;
  label: string;
  semitones: number;
  /** Partial of the LOWER note that coincides with the upper note's. */
  lowPartial: number;
  /** Partial of the UPPER note at that coincidence. */
  highPartial: number;
  ratio: string;
}

export const INTERVALS: Record<IntervalKind, IntervalSpec> = {
  M3: { kind: 'M3', label: 'Major 3rd', semitones: 4, lowPartial: 5, highPartial: 4, ratio: '5:4' },
  P4: { kind: 'P4', label: 'Perfect 4th', semitones: 5, lowPartial: 4, highPartial: 3, ratio: '4:3' },
  P5: { kind: 'P5', label: 'Perfect 5th', semitones: 7, lowPartial: 3, highPartial: 2, ratio: '3:2' },
  M6: { kind: 'M6', label: 'Major 6th', semitones: 9, lowPartial: 5, highPartial: 3, ratio: '5:3' },
  M10: { kind: 'M10', label: 'Major 10th', semitones: 16, lowPartial: 5, highPartial: 2, ratio: '5:2' },
};

export const INTERVAL_ORDER: IntervalKind[] = ['M3', 'P4', 'P5', 'M6', 'M10'];

/** How equal temperament bends an interval away from its pure form. */
export type Temper = 'wide' | 'narrow' | 'pure';

/**
 * How far the equal-tempered interval sits from the pure one defined by its
 * coincident partials, in cents. Positive means the tempered interval is WIDE
 * of pure, negative NARROW.
 *
 * Derived rather than tabulated, so it cannot drift from the partials above.
 * At A440 this gives the familiar picture: fifths are tempered narrow by about
 * 2 cents, fourths wide by about 2, and major thirds wide by nearly 14.
 */
export function temperingCents(spec: IntervalSpec): number {
  const pureRatio = spec.lowPartial / spec.highPartial;
  const temperedRatio = Math.pow(2, spec.semitones / 12);
  return 1200 * Math.log2(temperedRatio / pureRatio);
}

/** Whether equal temperament makes this interval wide, narrow, or leaves it pure. */
export function intervalTemper(spec: IntervalSpec): Temper {
  const cents = temperingCents(spec);
  if (Math.abs(cents) < 1e-9) return 'pure';
  return cents > 0 ? 'wide' : 'narrow';
}

/**
 * Beat rate of an interval, in beats per second: the frequency difference
 * between the two coincident partials.
 *
 * This assumes ideal harmonic strings. Real piano strings are inharmonic, so
 * measured beat rates run faster than these — increasingly so toward the ends
 * of the keyboard. Treat the numbers as a temperament-setting reference, not a
 * prediction for the top octave.
 */
export function beatRate(lowHz: number, highHz: number, spec: IntervalSpec): number {
  return Math.abs(spec.lowPartial * lowHz - spec.highPartial * highHz);
}

export interface BeatRow {
  lowMidi: number;
  lowName: string;
  lowHz: number;
  highMidi: number;
  highName: string;
  highHz: number;
  beatsPerSecond: number;
}

/** Default window is the temperament octave, F3 → F4. */
export const TEMPERAMENT_START_MIDI = 53; // F3
export const TEMPERAMENT_END_MIDI = 65; // F4

/** Beat rates for one interval across a run of starting notes. */
export function temperamentTable(
  kind: IntervalKind,
  opts: { startMidi?: number; endMidi?: number; a4Hz?: number } = {},
): BeatRow[] {
  const {
    startMidi = TEMPERAMENT_START_MIDI,
    endMidi = TEMPERAMENT_END_MIDI,
    a4Hz = A4_DEFAULT_HZ,
  } = opts;
  const spec = INTERVALS[kind];
  const rows: BeatRow[] = [];

  for (let lowMidi = startMidi; lowMidi <= endMidi; lowMidi++) {
    const highMidi = lowMidi + spec.semitones;
    const lowHz = midiToFrequency(lowMidi, a4Hz);
    const highHz = midiToFrequency(highMidi, a4Hz);
    rows.push({
      lowMidi,
      lowName: midiToNoteName(lowMidi),
      lowHz,
      highMidi,
      highName: midiToNoteName(highMidi),
      highHz,
      beatsPerSecond: beatRate(lowHz, highHz, spec),
    });
  }
  return rows;
}
