import { describe, it, expect } from 'vitest';
import { clientDetailLines, isOrganization } from '../client';

const base = { clientName: 'Riverside Country Club', clientEmail: 'ap@riverside.example', clientPhone: '(555) 010-2000' };

describe('isOrganization', () => {
  it('treats a missing clientType (older documents) as an individual', () => {
    expect(isOrganization({})).toBe(false);
  });

  it('is true only for organization', () => {
    expect(isOrganization({ clientType: 'organization' })).toBe(true);
    expect(isOrganization({ clientType: 'individual' })).toBe(false);
  });
});

describe('clientDetailLines', () => {
  it('lists email then phone for an individual', () => {
    expect(clientDetailLines(base)).toEqual(['ap@riverside.example', '(555) 010-2000']);
  });

  it('puts the Attn line first for an organization', () => {
    expect(
      clientDetailLines({ ...base, clientType: 'organization', clientContact: ' Dana Ruiz ' }),
    ).toEqual(['Attn: Dana Ruiz', 'ap@riverside.example', '(555) 010-2000']);
  });

  it('hides a leftover contact once switched back to individual', () => {
    expect(clientDetailLines({ ...base, clientType: 'individual', clientContact: 'Dana Ruiz' })).not.toContain(
      'Attn: Dana Ruiz',
    );
  });

  it('omits the Attn line when the contact is blank and skips empty fields', () => {
    expect(
      clientDetailLines({ ...base, clientEmail: '', clientType: 'organization', clientContact: '  ' }),
    ).toEqual(['(555) 010-2000']);
  });
});
