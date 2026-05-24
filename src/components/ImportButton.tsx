import { useRef, useState } from 'react';
import { Button } from './Button';
import { parseBackupFile, AnyBackup } from '../utils/backup';

interface ImportButtonProps {
  label?: string;
  onImport: (backup: AnyBackup) => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function ImportButton({
  label = 'Import',
  onImport,
  variant = 'secondary',
  size = 'md',
}: ImportButtonProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // reset so same file can be re-imported
    try {
      const backup = await parseBackupFile(file);
      setError('');
      onImport(backup);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <Button variant={variant} size={size} onClick={() => fileRef.current?.click()}>
        {label}
      </Button>
      <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFile} />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
