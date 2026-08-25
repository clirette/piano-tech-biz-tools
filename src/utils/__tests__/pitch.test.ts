import { describe, it, expect } from 'vitest';
import {
  A4_DEFAULT_HZ,
  PIANO_NOTES,
  PIANO_LOWEST_MIDI,
  PIANO_HIGHEST_MIDI,
  midiToNoteName,
  midiToFrequency,
  frequencyToMidi,
  centsBetween,
  shiftByCents,
  nearestNote,
  beatRate,
  temperamentTable,
  INTERVALS,
  INTERVAL_ORDER,
  intervalTemper,
  temperingCents,
} from '../pitch';

describe('note names', () => {
  it('names notes in scientific pitch notation', () => {
    expect(midiToNoteName(69)).toBe('A4');
    expect(midiToNoteName(60)).toBe('C4');
    expect(midiToNoteName(70)).toBe('A#4');
    expect(midiToNoteName(21)).toBe('A0');
    expect(midiToNoteName(108)).toBe('C8');
  });
});

describe('midiToFrequency', () => {
  it('pins A4 to the reference', () => {
    expect(midiToFrequency(69)).toBe(A4_DEFAULT_HZ);
    expect(midiToFrequency(69, 442)).toBe(442);
  });

  it('doubles every octave', () => {
    expect(midiToFrequency(57)).toBeCloseTo(220, 9);
    expect(midiToFrequency(81)).toBeCloseTo(880, 9);
  });

  it('matches known equal-tempered frequencies', () => {
    expect(midiToFrequency(60)).toBeCloseTo(261.6255653, 6); // C4
    expect(midiToFrequency(21)).toBeCloseTo(27.5, 9); // A0
    expect(midiToFrequency(108)).toBeCloseTo(4186.009, 3); // C8
  });

  it('scales with a non-440 reference', () => {
    expect(midiToFrequency(60, 442)).toBeCloseTo(midiToFrequency(60) * (442 / 440), 9);
  });
});

describe('frequencyToMidi', () => {
  it('round-trips every key on the piano, at 440 and 442', () => {
    for (const a4 of [440, 442]) {
      for (let midi = PIANO_LOWEST_MIDI; midi <= PIANO_HIGHEST_MIDI; midi++) {
        expect(frequencyToMidi(midiToFrequency(midi, a4), a4)).toBeCloseTo(midi, 9);
      }
    }
  });

  it('returns null for a non-positive frequency', () => {
    expect(frequencyToMidi(0)).toBeNull();
    expect(frequencyToMidi(-100)).toBeNull();
    expect(frequencyToMidi(NaN)).toBeNull();
  });
});

describe('cents', () => {
  it('measures octaves and unisons', () => {
    expect(centsBetween(440, 880)).toBeCloseTo(1200, 9);
    expect(centsBetween(440, 440)).toBeCloseTo(0, 9);
    expect(centsBetween(880, 440)).toBeCloseTo(-1200, 9);
  });

  it('measures a semitone as 100 cents', () => {
    expect(centsBetween(440, midiToFrequency(70))).toBeCloseTo(100, 9);
  });

  it('shiftByCents inverts centsBetween', () => {
    for (const c of [-1200, -13.7, 0, 2, 50, 1200]) {
      expect(centsBetween(440, shiftByCents(440, c))).toBeCloseTo(c, 9);
    }
  });

  it('shifts an octave', () => {
    expect(shiftByCents(440, 1200)).toBeCloseTo(880, 9);
  });

  it('returns NaN for non-positive frequencies', () => {
    expect(centsBetween(0, 440)).toBeNaN();
    expect(centsBetween(440, 0)).toBeNaN();
    expect(centsBetween(-1, -2)).toBeNaN();
  });
});

describe('nearestNote', () => {
  it('identifies an exact note as zero cents off', () => {
    const n = nearestNote(440)!;
    expect(n.name).toBe('A4');
    expect(n.centsOff).toBeCloseTo(0, 9);
  });

  it('reports how sharp a frequency sits', () => {
    const n = nearestNote(445)!;
    expect(n.name).toBe('A4');
    expect(n.centsOff).toBeCloseTo(19.56, 1);
  });

  it('reports how flat a frequency sits', () => {
    const n = nearestNote(435)!;
    expect(n.name).toBe('A4');
    expect(n.centsOff).toBeLessThan(0);
  });

  it('follows the A4 reference', () => {
    expect(nearestNote(442, 442)!.centsOff).toBeCloseTo(0, 9);
  });

  it('returns null for a non-positive frequency', () => {
    expect(nearestNote(0)).toBeNull();
  });
});

describe('PIANO_NOTES', () => {
  it('covers all 88 keys from A0 to C8', () => {
    expect(PIANO_NOTES).toHaveLength(88);
    expect(PIANO_NOTES[0]).toEqual({ midi: 21, name: 'A0', pianoKey: 1 });
    expect(PIANO_NOTES[87]).toEqual({ midi: 108, name: 'C8', pianoKey: 88 });
  });
});

describe('beat rates', () => {
  const C4 = midiToFrequency(60);
  const E4 = midiToFrequency(64);
  const F4 = midiToFrequency(65);
  const G4 = midiToFrequency(67);

  it('matches hand-computed equal-tempered rates', () => {
    expect(beatRate(C4, E4, INTERVALS.M3)).toBeCloseTo(10.382, 2);
    expect(beatRate(C4, G4, INTERVALS.P5)).toBeCloseTo(0.886, 2);
    expect(beatRate(C4, F4, INTERVALS.P4)).toBeCloseTo(1.182, 2);
  });

  it('is zero for a just interval', () => {
    expect(beatRate(200, 250, INTERVALS.M3)).toBeCloseTo(0, 9); // 5:4
    expect(beatRate(200, 300, INTERVALS.P5)).toBeCloseTo(0, 9); // 3:2
    expect(beatRate(300, 400, INTERVALS.P4)).toBeCloseTo(0, 9); // 4:3
  });

  it('is never negative, whichever way the arguments go', () => {
    expect(beatRate(E4, C4, INTERVALS.M3)).toBeGreaterThanOrEqual(0);
  });

  it('encodes the just ratio of every interval', () => {
    for (const kind of INTERVAL_ORDER) {
      const spec = INTERVALS[kind];
      const justRatio = spec.lowPartial / spec.highPartial;
      const temperedRatio = Math.pow(2, spec.semitones / 12);
      // The coincident partials define the just interval the tempered one approximates.
      expect(justRatio).toBeCloseTo(temperedRatio, 1);
    }
  });
});

describe('temperamentTable', () => {
  it('beats faster going up the temperament octave', () => {
    const rows = temperamentTable('M3');
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].beatsPerSecond).toBeGreaterThan(rows[i - 1].beatsPerSecond);
    }
  });

  it('has thirds beating faster than fifths everywhere', () => {
    // The aural fact the table exists to encode.
    const thirds = temperamentTable('M3');
    const fifths = temperamentTable('P5');
    const slowestThird = Math.min(...thirds.map(r => r.beatsPerSecond));
    const fastestFifth = Math.max(...fifths.map(r => r.beatsPerSecond));
    expect(slowestThird).toBeGreaterThan(fastestFifth);
  });

  it('scales every rate with the A4 reference', () => {
    const at440 = temperamentTable('M3', { a4Hz: 440 });
    const at442 = temperamentTable('M3', { a4Hz: 442 });
    at440.forEach((row, i) => {
      expect(at442[i].beatsPerSecond).toBeCloseTo(row.beatsPerSecond * (442 / 440), 9);
    });
  });

  it('spans the requested window and spaces each pair by the interval', () => {
    const rows = temperamentTable('P5', { startMidi: 60, endMidi: 64 });
    expect(rows).toHaveLength(5);
    for (const row of rows) {
      expect(row.highMidi).toBe(row.lowMidi + INTERVALS.P5.semitones);
    }
    expect(rows[0].lowName).toBe('C4');
  });

  it('returns nothing when the window is inverted', () => {
    expect(temperamentTable('M3', { startMidi: 65, endMidi: 53 })).toEqual([]);
  });
});

describe('interval tempering', () => {
  it('tempers fifths narrow and fourths wide by the same ~2 cents', () => {
    expect(intervalTemper(INTERVALS.P5)).toBe('narrow');
    expect(temperingCents(INTERVALS.P5)).toBeCloseTo(-1.955, 2);

    expect(intervalTemper(INTERVALS.P4)).toBe('wide');
    expect(temperingCents(INTERVALS.P4)).toBeCloseTo(1.955, 2);

    // A fourth is the inversion of a fifth, so they temper by equal and
    // opposite amounts.
    expect(temperingCents(INTERVALS.P4)).toBeCloseTo(-temperingCents(INTERVALS.P5), 9);
  });

  it('tempers thirds and sixths wide, and by much more than the fifths', () => {
    expect(intervalTemper(INTERVALS.M3)).toBe('wide');
    expect(temperingCents(INTERVALS.M3)).toBeCloseTo(13.686, 2);

    expect(intervalTemper(INTERVALS.M6)).toBe('wide');
    expect(temperingCents(INTERVALS.M6)).toBeCloseTo(15.641, 2);

    expect(Math.abs(temperingCents(INTERVALS.M3))).toBeGreaterThan(
      Math.abs(temperingCents(INTERVALS.P5)) * 5,
    );
  });

  it('tempers a major tenth by the same amount as the major third it extends', () => {
    expect(intervalTemper(INTERVALS.M10)).toBe('wide');
    expect(temperingCents(INTERVALS.M10)).toBeCloseTo(temperingCents(INTERVALS.M3), 9);
  });

  it('calls a genuinely pure interval pure', () => {
    // An octave: 2:1 partials over 12 semitones is exact in equal temperament.
    const octave = {
      kind: 'P5' as const,
      label: 'Octave',
      semitones: 12,
      lowPartial: 2,
      highPartial: 1,
      ratio: '2:1',
    };
    expect(temperingCents(octave)).toBeCloseTo(0, 9);
    expect(intervalTemper(octave)).toBe('pure');
  });
});
