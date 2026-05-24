import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LineItemsTable } from '../LineItemsTable';
import type { LineItem } from '../../../../types';

function makeItem(overrides: Partial<LineItem> = {}): LineItem {
  return {
    id: 'item-1',
    description: 'Tuning',
    type: 'labor',
    quantity: 1,
    unitPriceCents: 18000,
    ...overrides,
  };
}

describe('LineItemsTable', () => {
  it('shows empty-state message when no items are provided', () => {
    render(<LineItemsTable lineItems={[]} onChange={vi.fn()} />);
    expect(screen.getByText(/no items yet/i)).toBeInTheDocument();
  });

  it('calls onChange with one blank item when Add Item is clicked', async () => {
    const onChange = vi.fn();
    render(<LineItemsTable lineItems={[]} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /add item/i }));
    expect(onChange).toHaveBeenCalledOnce();
    const items = onChange.mock.calls[0][0] as LineItem[];
    expect(items).toHaveLength(1);
    expect(items[0].description).toBe('');
    expect(items[0].unitPriceCents).toBe(0);
    expect(items[0].type).toBe('labor');
    expect(items[0].quantity).toBe(1);
  });

  it('calls onChange without the removed item when × is clicked', async () => {
    const onChange = vi.fn();
    render(<LineItemsTable lineItems={[makeItem()]} onChange={onChange} />);
    await userEvent.click(screen.getByTitle('Remove item'));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('opens the Quick Add menu and adds a preset item', async () => {
    const onChange = vi.fn();
    render(<LineItemsTable lineItems={[]} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /quick add/i }));
    await userEvent.click(screen.getByText('Standard Tuning'));
    expect(onChange).toHaveBeenCalledOnce();
    const items = onChange.mock.calls[0][0] as LineItem[];
    expect(items[0].description).toBe('Standard Tuning');
    expect(items[0].unitPriceCents).toBe(18000);
  });

  it('parses the unit price from the input on blur', () => {
    const onChange = vi.fn();
    render(<LineItemsTable lineItems={[makeItem({ unitPriceCents: 18000 })]} onChange={onChange} />);
    const priceInput = screen.getByDisplayValue('$180.00') as HTMLInputElement;
    // Simulate user clearing and typing a new price, then blurring
    fireEvent.change(priceInput, { target: { value: '120.99' } });
    fireEvent.blur(priceInput);
    const lastItems = onChange.mock.calls[onChange.mock.calls.length - 1][0] as LineItem[];
    expect(lastItems[0].unitPriceCents).toBe(12099);
  });

  it('clamps quantity to a minimum of 1', () => {
    const onChange = vi.fn();
    render(<LineItemsTable lineItems={[makeItem({ quantity: 3 })]} onChange={onChange} />);
    const qtyInput = screen.getByDisplayValue('3') as HTMLInputElement;
    fireEvent.change(qtyInput, { target: { value: '0' } });
    fireEvent.blur(qtyInput);
    const lastItems = onChange.mock.calls[onChange.mock.calls.length - 1][0] as LineItem[];
    expect(lastItems[0].quantity).toBeGreaterThanOrEqual(1);
  });

  it('toggles the line notes textarea on and off', async () => {
    render(<LineItemsTable lineItems={[makeItem()]} onChange={vi.fn()} />);
    expect(screen.queryByPlaceholderText(/add a note for this line item/i)).not.toBeInTheDocument();
    await userEvent.click(screen.getByTitle('Add note'));
    expect(screen.getByPlaceholderText(/add a note for this line item/i)).toBeInTheDocument();
    await userEvent.click(screen.getByTitle('Hide note'));
    expect(screen.queryByPlaceholderText(/add a note for this line item/i)).not.toBeInTheDocument();
  });

  it('shows the notes textarea expanded by default when item has existing lineNotes', () => {
    const item = makeItem({ lineNotes: 'Already has a note' });
    render(<LineItemsTable lineItems={[item]} onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText(/add a note for this line item/i)).toBeInTheDocument();
  });
});
