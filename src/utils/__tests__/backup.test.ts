import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { parseBackupFile, daysSinceLastBackup } from '../backup';

function makeFile(content: string): File {
  return new File([content], 'backup.json', { type: 'application/json' });
}

describe('parseBackupFile', () => {
  it('resolves with a valid full backup', async () => {
    const data = {
      version: 1,
      type: 'full',
      exportedAt: new Date().toISOString(),
      company: {},
      estimates: [],
      invoices: [],
    };
    await expect(parseBackupFile(makeFile(JSON.stringify(data)))).resolves.toEqual(data);
  });

  it('resolves with a valid estimate backup', async () => {
    const data = { version: 1, type: 'estimate', exportedAt: new Date().toISOString(), estimate: {} };
    await expect(parseBackupFile(makeFile(JSON.stringify(data)))).resolves.toMatchObject({
      version: 1,
      type: 'estimate',
    });
  });

  it('rejects invalid JSON', async () => {
    await expect(parseBackupFile(makeFile('not-valid-json{{{'))).rejects.toThrow(
      'Could not parse file',
    );
  });

  it('rejects an object missing version', async () => {
    await expect(
      parseBackupFile(makeFile(JSON.stringify({ type: 'full' }))),
    ).rejects.toThrow();
  });

  it('rejects an object missing type', async () => {
    await expect(
      parseBackupFile(makeFile(JSON.stringify({ version: 1 }))),
    ).rejects.toThrow();
  });
});

describe('daysSinceLastBackup', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null when no backup has been recorded', () => {
    expect(daysSinceLastBackup()).toBeNull();
  });

  it('returns 0 when backed up at the current moment', () => {
    const now = new Date('2024-06-15T12:00:00Z');
    vi.setSystemTime(now);
    localStorage.setItem('piano-estimate:lastBackupAt', now.toISOString());
    expect(daysSinceLastBackup()).toBe(0);
  });

  it('returns the correct number of days for a past backup', () => {
    const backupDate = new Date('2024-06-08T12:00:00Z');
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
    localStorage.setItem('piano-estimate:lastBackupAt', backupDate.toISOString());
    expect(daysSinceLastBackup()).toBe(7);
  });

  it('returns 1 for a backup made yesterday', () => {
    const yesterday = new Date('2024-06-14T12:00:00Z');
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
    localStorage.setItem('piano-estimate:lastBackupAt', yesterday.toISOString());
    expect(daysSinceLastBackup()).toBe(1);
  });
});
