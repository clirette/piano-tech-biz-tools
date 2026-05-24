import { Invoice, InvoiceStatus, LineItem } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { generateId } from '../utils/generateId';

const STORAGE_KEY = 'piano-estimate:invoices';

function localDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dueDateString(d: Date): string {
  const due = new Date(d);
  due.setDate(due.getDate() + 30);
  return localDateString(due);
}

function newInvoice(): Invoice {
  const now = new Date().toISOString();
  const today = new Date();
  return {
    id: generateId(),
    invoiceNumber: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    pianoMake: '',
    pianoModel: '',
    pianoSerial: '',
    pianoLocation: '',
    date: localDateString(today),
    dueDate: dueDateString(today),
    lineItems: [],
    notes: '',
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };
}

export function useInvoices() {
  const [invoices, setInvoices] = useLocalStorage<Invoice[]>(STORAGE_KEY, []);

  function createInvoice(): Invoice {
    const invoice = newInvoice();
    setInvoices(prev => [invoice, ...prev]);
    return invoice;
  }

  function createInvoiceFromEstimate(fields: {
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    pianoMake: string;
    pianoModel: string;
    pianoSerial: string;
    pianoLocation: string;
    lineItems: LineItem[];
    notes: string;
  }): Invoice {
    const base = newInvoice();
    const invoice: Invoice = { ...base, ...fields };
    setInvoices(prev => [invoice, ...prev]);
    return invoice;
  }

  function updateInvoice(id: string, changes: Partial<Omit<Invoice, 'id' | 'createdAt'>>) {
    setInvoices(prev =>
      prev.map(inv =>
        inv.id === id ? { ...inv, ...changes, updatedAt: new Date().toISOString() } : inv,
      ),
    );
  }

  function updateLineItems(id: string, lineItems: LineItem[]) {
    updateInvoice(id, { lineItems });
  }

  function deleteInvoice(id: string) {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
  }

  function setStatus(id: string, status: InvoiceStatus) {
    updateInvoice(id, { status });
  }

  function getInvoice(id: string): Invoice | undefined {
    return invoices.find(inv => inv.id === id);
  }

  return {
    invoices,
    setInvoices,
    createInvoice,
    createInvoiceFromEstimate,
    updateInvoice,
    updateLineItems,
    deleteInvoice,
    setStatus,
    getInvoice,
  };
}
