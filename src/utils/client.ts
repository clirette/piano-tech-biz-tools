import { ClientType } from '../types';

/** The client fields shared by estimates and invoices. */
export interface ClientInfo {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientType?: ClientType;
  clientContact?: string;
}

export function isOrganization(client: Pick<ClientInfo, 'clientType'>): boolean {
  return client.clientType === 'organization';
}

/**
 * The lines printed under the client's name, in order. Both the preview page
 * and pdf.ts render from this so the two can't drift. The contact person only
 * appears for organizations — switching a document back to "Individual" hides
 * it without discarding what was typed.
 */
export function clientDetailLines(client: ClientInfo): string[] {
  const contact = isOrganization(client) ? client.clientContact?.trim() : '';
  return [contact ? `Attn: ${contact}` : '', client.clientEmail, client.clientPhone].filter(Boolean);
}
