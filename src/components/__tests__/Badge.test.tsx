import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../Badge';
import type { EstimateStatus, InvoiceStatus } from '../../types';

type AnyStatus = EstimateStatus | InvoiceStatus;

const cases: Array<{ status: AnyStatus; label: string }> = [
  { status: 'draft', label: 'Draft' },
  { status: 'sent', label: 'Sent' },
  { status: 'accepted', label: 'Accepted' },
  { status: 'declined', label: 'Declined' },
  { status: 'paid', label: 'Paid' },
  { status: 'overdue', label: 'Overdue' },
];

describe('Badge', () => {
  cases.forEach(({ status, label }) => {
    it(`renders "${label}" for status "${status}"`, () => {
      render(<Badge status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('renders as an inline span element', () => {
    render(<Badge status="draft" />);
    const badge = screen.getByText('Draft');
    expect(badge.tagName).toBe('SPAN');
  });
});
