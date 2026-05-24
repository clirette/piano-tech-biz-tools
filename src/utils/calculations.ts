import { LineItem } from '../types';

export function lineItemTotal(item: LineItem): number {
  return item.quantity * item.unitPriceCents;
}

export function documentTotal(doc: { lineItems: LineItem[] }): number {
  return doc.lineItems.reduce((sum, item) => sum + lineItemTotal(item), 0);
}

/** @deprecated use documentTotal */
export function estimateTotal(estimate: { lineItems: LineItem[] }): number {
  return documentTotal(estimate);
}

export function laborTotal(doc: { lineItems: LineItem[] }): number {
  return doc.lineItems
    .filter(i => i.type === 'labor')
    .reduce((sum, item) => sum + lineItemTotal(item), 0);
}

export function partsTotal(doc: { lineItems: LineItem[] }): number {
  return doc.lineItems
    .filter(i => i.type === 'parts')
    .reduce((sum, item) => sum + lineItemTotal(item), 0);
}
