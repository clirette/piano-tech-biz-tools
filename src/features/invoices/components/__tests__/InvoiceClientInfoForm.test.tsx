import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InvoiceClientInfoForm } from '../InvoiceClientInfoForm';
import type { Invoice } from '../../../../types';

const invoice: Invoice = {
  id: 'inv-1',
  invoiceNumber: '',
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  pianoMake: '',
  pianoModel: '',
  pianoSerial: '',
  pianoLocation: '',
  date: '2026-11-18',
  dueDate: '2026-12-18',
  lineItems: [],
  notes: '',
  status: 'draft',
  createdAt: '2026-11-18T10:00:00.000Z',
  updatedAt: '2026-11-18T10:00:00.000Z',
};

describe('InvoiceClientInfoForm — client type', () => {
  it('defaults older invoices (no clientType) to Individual with no contact field', () => {
    render(<InvoiceClientInfoForm invoice={invoice} onChange={vi.fn()} />);
    expect(screen.getByRole('radio', { name: 'Individual' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByLabelText('Client Name')).toBeInTheDocument();
    expect(screen.queryByLabelText('Contact Person')).not.toBeInTheDocument();
  });

  it('reports the switch to organization', async () => {
    const onChange = vi.fn();
    render(<InvoiceClientInfoForm invoice={invoice} onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: 'Organization' }));
    expect(onChange).toHaveBeenCalledWith({ clientType: 'organization' });
  });

  it('shows organization name and contact person fields for an organization', async () => {
    const onChange = vi.fn();
    render(
      <InvoiceClientInfoForm invoice={{ ...invoice, clientType: 'organization' }} onChange={onChange} />,
    );
    expect(screen.getByLabelText('Organization Name')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Contact Person'), 'D');
    expect(onChange).toHaveBeenCalledWith({ clientContact: 'D' });
  });
});
