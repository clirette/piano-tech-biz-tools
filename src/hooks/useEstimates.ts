import { Estimate, EstimateStatus, LineItem } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { generateId } from '../utils/generateId';

const STORAGE_KEY = 'piano-estimate:estimates';

function localDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function newEstimate(): Estimate {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    estimateNumber: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    pianoMake: '',
    pianoModel: '',
    pianoSerial: '',
    pianoLocation: '',
    date: localDateString(new Date()),
    lineItems: [],
    notes: '',
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };
}

export function useEstimates() {
  const [estimates, setEstimates] = useLocalStorage<Estimate[]>(STORAGE_KEY, []);

  function createEstimate(): Estimate {
    const estimate = newEstimate();
    setEstimates(prev => [estimate, ...prev]);
    return estimate;
  }

  function updateEstimate(id: string, changes: Partial<Omit<Estimate, 'id' | 'createdAt'>>) {
    setEstimates(prev =>
      prev.map(e =>
        e.id === id ? { ...e, ...changes, updatedAt: new Date().toISOString() } : e,
      ),
    );
  }

  function updateLineItems(id: string, lineItems: LineItem[]) {
    updateEstimate(id, { lineItems });
  }

  function deleteEstimate(id: string) {
    setEstimates(prev => prev.filter(e => e.id !== id));
  }

  function setStatus(id: string, status: EstimateStatus) {
    updateEstimate(id, { status });
  }

  function getEstimate(id: string): Estimate | undefined {
    return estimates.find(e => e.id === id);
  }

  return {
    estimates,
    setEstimates,
    createEstimate,
    updateEstimate,
    updateLineItems,
    deleteEstimate,
    setStatus,
    getEstimate,
  };
}
