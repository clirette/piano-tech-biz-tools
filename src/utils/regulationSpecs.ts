/**
 * Reference table of typical action regulation specifications.
 *
 * ⚠️ INTENTIONALLY EMPTY — AWAITING A SOURCE.
 *
 * Unlike everything else in the bench tools, these are not derivable from a
 * formula: they are published figures. A technician could regulate a real
 * action to whatever appears here, so inventing plausible-looking numbers would
 * be actively harmful. The table stays empty until values are transcribed from
 * a citable reference, and the UI renders a "pending" placeholder while it is.
 *
 * Candidate sources, most defensible first:
 *   1. Manufacturer service manuals (Steinway, Yamaha, Kawai, Renner) — most
 *      authoritative, but model-specific, so they would need to be presented as
 *      "e.g. Yamaha grand" rather than "typical".
 *   2. Reblitz, "Piano Servicing, Tuning, and Rebuilding" — the standard
 *      reference, and it consolidates typical ranges.
 *   3. Piano Technicians Guild technical and exam materials.
 *
 * Note also that transcribing a full spec table verbatim from a copyrighted
 * book is a reproduction — prefer widely-published ranges carried with an
 * explicit on-screen citation, or link out rather than reproduce.
 *
 * When filling this in, set SOURCE_CITATION as well; the UI displays it.
 */

export interface RegulationSpec {
  /** e.g. "Key dip" */
  name: string;
  /** Display string, e.g. "10.0-10.5 mm (0.394-0.413 in)". Not parsed. */
  grand: string;
  vertical: string;
  /** Short clarifier, e.g. where the measurement is taken. */
  note?: string;
}

/** Shown beneath the table when data is present. Empty while the table is. */
export const SOURCE_CITATION = '';

export const REGULATION_SPECS: RegulationSpec[] = [];

/**
 * The measurements the table should eventually cover. Used by the tests to
 * catch a half-filled table, and by the UI to describe what is coming.
 */
export const EXPECTED_SPEC_NAMES = [
  'Key dip',
  'Blow distance',
  'Let-off',
  'Drop',
  'Aftertouch',
  'Checking',
  'Damper lift',
] as const;

/** Whether there is anything to render yet. */
export function hasRegulationSpecs(): boolean {
  return REGULATION_SPECS.length > 0;
}
