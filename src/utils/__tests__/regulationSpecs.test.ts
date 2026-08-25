import { describe, it, expect } from 'vitest';
import {
  REGULATION_SPECS,
  EXPECTED_SPEC_NAMES,
  SOURCE_CITATION,
  hasRegulationSpecs,
} from '../regulationSpecs';

// Shape-only guards. They pass while the table is empty and start enforcing the
// moment real data lands, so a half-filled or uncited table cannot ship quietly.
describe('regulation specs', () => {
  it('agrees with hasRegulationSpecs about whether it has data', () => {
    expect(hasRegulationSpecs()).toBe(REGULATION_SPECS.length > 0);
  });

  it('gives every entry a name and both action types', () => {
    for (const spec of REGULATION_SPECS) {
      expect(spec.name.trim()).not.toBe('');
      expect(spec.grand.trim()).not.toBe('');
      expect(spec.vertical.trim()).not.toBe('');
    }
  });

  it('has no duplicate measurement names', () => {
    const names = REGULATION_SPECS.map(s => s.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('covers every expected measurement once it has any data', () => {
    if (!hasRegulationSpecs()) return;
    const names = REGULATION_SPECS.map(s => s.name);
    for (const expected of EXPECTED_SPEC_NAMES) {
      expect(names).toContain(expected);
    }
  });

  it('carries a source citation once it has any data', () => {
    if (!hasRegulationSpecs()) return;
    expect(SOURCE_CITATION.trim()).not.toBe('');
  });
});
