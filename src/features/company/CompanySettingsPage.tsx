import { useRef, useState } from 'react';
import { useCompanySettings } from '../../hooks/useCompanySettings';
import { Button } from '../../components/Button';
import { QrCode } from '../../components/QrCode';
import { qrMatrix } from '../../utils/qr';
import { Input } from '../../components/Input';
import { ImportButton } from '../../components/ImportButton';
import { formatPhone } from '../../utils/format';
import { exportCompanyBackup, AnyBackup, CompanyBackup } from '../../utils/backup';
import { TextArea } from '../../components/TextArea';
import { generateId } from '../../utils/generateId';
import { getOnlineMethods } from '../../utils/payment';
import { CompanySettings, OnlinePaymentMethod, PaymentSettings } from '../../types';

const QUICK_ADD_METHODS = ['Venmo', 'Zelle', 'PayPal', 'Cash App'];

/** Placeholder examples for the link/instructions fields, keyed off the method name. */
function methodHints(name: string): { url: string; instructions: string } {
  switch (name.trim().toLowerCase()) {
    case 'venmo':
      return { url: 'https://venmo.com/u/your-username', instructions: '@your-username' };
    case 'zelle':
      return { url: 'https://…', instructions: 'Send to you@example.com or (555) 555-0100' };
    case 'paypal':
      return { url: 'https://paypal.me/yourname', instructions: 'Send to you@example.com' };
    case 'cash app':
      return { url: 'https://cash.app/$yourcashtag', instructions: '$yourcashtag' };
    default:
      return { url: 'https://…', instructions: 'How clients should pay you' };
  }
}

export function CompanySettingsPage() {
  const { settings, setSettings } = useCompanySettings();
  const [saved, setSaved] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function handleChange(field: keyof Omit<CompanySettings, 'payment'>, value: string | boolean) {
    setSettings(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  function handlePayment(field: keyof PaymentSettings, value: string | boolean) {
    setSettings(prev => ({
      ...prev,
      payment: { ...prev.payment, [field]: value },
    }));
    setSaved(false);
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      handleChange('logoDataUrl', reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  /** Edits always write `onlineMethods`, which retires the legacy single-method fields. */
  function updateOnlineMethods(fn: (methods: OnlinePaymentMethod[]) => OnlinePaymentMethod[]) {
    setSettings(prev => ({
      ...prev,
      payment: { ...prev.payment, onlineMethods: fn(getOnlineMethods(prev.payment)) },
    }));
    setSaved(false);
  }

  function addMethod(name: string) {
    updateOnlineMethods(ms => [...ms, { id: generateId(), name, url: '', instructions: '' }]);
  }

  function updateMethod(id: string, patch: Partial<OnlinePaymentMethod>) {
    updateOnlineMethods(ms => ms.map(m => (m.id === id ? { ...m, ...patch } : m)));
  }

  function removeMethod(id: string) {
    updateOnlineMethods(ms => ms.filter(m => m.id !== id));
  }

  const { payment } = settings;
  const onlineMethods = getOnlineMethods(payment);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Company Settings</h1>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Logo */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
          <h2 className="font-semibold text-slate-700">Logo</h2>
          <div className="flex items-center gap-4">
            {settings.logoDataUrl ? (
              <img
                src={settings.logoDataUrl}
                alt="Company logo"
                className="h-20 w-20 object-contain rounded border border-slate-200 bg-slate-50 p-1"
              />
            ) : (
              <div className="h-20 w-20 rounded border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs text-center p-1">
                No logo
              </div>
            )}
            <div className="space-y-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
                Upload Logo
              </Button>
              {settings.logoDataUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700"
                  onClick={() => handleChange('logoDataUrl', '')}
                >
                  Remove
                </Button>
              )}
              <p className="text-xs text-slate-500">PNG or JPG recommended</p>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleLogoUpload}
          />
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
          <h2 className="font-semibold text-slate-700">Contact Information</h2>
          <Input
            label="Business Name"
            value={settings.name}
            onChange={e => handleChange('name', e.target.value)}
            placeholder="My Piano Service"
          />
          <Input
            label="Slogan"
            value={settings.slogan}
            onChange={e => handleChange('slogan', e.target.value)}
            placeholder="Bringing pianos to life"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Phone"
              type="tel"
              value={settings.phone}
                onChange={e => handleChange('phone', formatPhone(e.target.value))}
              placeholder="(555) 555-0100"
            />
            <Input
              label="Email"
              type="email"
              value={settings.email}
              onChange={e => handleChange('email', e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <Input
            label="Address"
            value={settings.address}
            onChange={e => handleChange('address', e.target.value)}
            placeholder="123 Main St, City, ST 00000"
          />
          <Input
            label="Website"
            type="url"
            value={settings.website}
            onChange={e => handleChange('website', e.target.value)}
            placeholder="https://example.com"
          />
        </div>

        {/* Invoice Payment Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
          <h2 className="font-semibold text-slate-700">Invoice Payment Methods</h2>
          <p className="text-xs text-slate-500">Select the payment methods you accept. These will appear at the bottom of every invoice.</p>

          {/* Cash */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded accent-brand-600"
              checked={payment.acceptCash}
              onChange={e => handlePayment('acceptCash', e.target.checked)}
            />
            <span className="text-sm font-medium text-slate-700">Cash</span>
          </label>

          {/* Check */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded accent-brand-600"
                checked={payment.acceptCheck}
                onChange={e => handlePayment('acceptCheck', e.target.checked)}
              />
              <span className="text-sm font-medium text-slate-700">Check</span>
            </label>
            {payment.acceptCheck && (
              <div className="ml-7">
                <Input
                  label="Make check payable to"
                  value={payment.checkPayableTo}
                  onChange={e => handlePayment('checkPayableTo', e.target.value)}
                  placeholder="Your Business Name"
                />
              </div>
            )}
          </div>

          {/* Online methods (Venmo, Zelle, card link…) */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div>
              <h3 className="text-sm font-medium text-slate-700">Online payment</h3>
              <p className="text-xs text-slate-500">
                Add each service you accept. Give it a payment link, instructions on how to pay, or both.
              </p>
            </div>

            {onlineMethods.map(method => {
              const hints = methodHints(method.name);
              return (
                <div key={method.id} className="rounded-lg border border-slate-200 p-4 space-y-3">
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <Input
                        id={`pm-${method.id}-name`}
                        label="Name"
                        list="payment-method-names"
                        value={method.name}
                        onChange={e => updateMethod(method.id, { name: e.target.value })}
                        placeholder="Venmo, Zelle, Credit Card…"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => removeMethod(method.id)}
                    >
                      Remove
                    </Button>
                  </div>
                  <Input
                    id={`pm-${method.id}-url`}
                    label="Payment link (optional)"
                    type="url"
                    value={method.url ?? ''}
                    onChange={e => updateMethod(method.id, { url: e.target.value })}
                    placeholder={hints.url}
                  />
                  <TextArea
                    id={`pm-${method.id}-instructions`}
                    label="Instructions (optional)"
                    rows={2}
                    value={method.instructions ?? ''}
                    onChange={e => updateMethod(method.id, { instructions: e.target.value })}
                    placeholder={hints.instructions}
                  />
                  {method.url?.trim() && (
                    <div>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded accent-brand-600 mt-0.5"
                          checked={method.showQr !== false}
                          onChange={e => updateMethod(method.id, { showQr: e.target.checked })}
                        />
                        <span className="text-sm text-slate-700">
                          Show a scannable QR code on invoices
                          <span className="block text-xs text-slate-400">
                            Clients can scan to open this link instead of typing it.
                          </span>
                        </span>
                      </label>
                      {method.showQr !== false && (
                        <div className="mt-3 ml-7">
                          {qrMatrix(method.url.trim()) ? (
                            <div className="inline-block text-center">
                              <QrCode value={method.url.trim()} size={96} label={`${method.name || 'Payment'} QR preview`} />
                              <p className="text-[10px] text-slate-400 mt-1">Preview</p>
                            </div>
                          ) : (
                            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                              This link is too long to fit in a QR code. Invoices will show it as a
                              text link instead.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500">Add:</span>
              {QUICK_ADD_METHODS.map(name => (
                <Button key={name} type="button" variant="secondary" size="sm" onClick={() => addMethod(name)}>
                  + {name}
                </Button>
              ))}
              <Button type="button" variant="secondary" size="sm" onClick={() => addMethod('')}>
                + Other
              </Button>
            </div>
            <datalist id="payment-method-names">
              {[...QUICK_ADD_METHODS, 'Credit Card', 'Square', 'Stripe'].map(n => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Google Review */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
          <h2 className="font-semibold text-slate-700">Google Review Prompt</h2>
          <Input
            label="Google Review URL"
            type="url"
            value={settings.googleReviewUrl}
            onChange={e => handleChange('googleReviewUrl', e.target.value)}
            placeholder="https://g.page/r/your-review-link"
            hint="When set, a review request can be shown at the bottom of estimates and invoices."
          />
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              checked={settings.showGoogleReviewOnEstimates}
              onChange={e => handleChange('showGoogleReviewOnEstimates', e.target.checked)}
            />
            <span className="text-sm text-slate-700">Show on estimates</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              checked={settings.showGoogleReviewOnInvoices}
              onChange={e => handleChange('showGoogleReviewOnInvoices', e.target.checked)}
            />
            <span className="text-sm text-slate-700">Show on invoices</span>
          </label>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button type="submit" size="lg">
            Save Settings
          </Button>
          <Button type="button" variant="secondary" onClick={() => exportCompanyBackup(settings)}>
            ⬇ Export Settings
          </Button>
          <ImportButton
            label="⬆ Import Settings"
            variant="secondary"
            onImport={(backup: AnyBackup) => {
              if (backup.type === 'company' || backup.type === 'full') {
                const incoming: CompanySettings =
                  backup.type === 'company'
                    ? (backup as CompanyBackup).company
                    : (backup as { company: CompanySettings }).company;
                if (!confirm('This will replace your current company settings. Continue?')) return;
                setSettings(incoming);
                setSaved(false);
                setImportMsg('✓ Company settings imported.');
                setTimeout(() => setImportMsg(''), 4000);
              } else {
                setImportMsg('This file contains estimate data, not company settings.');
                setTimeout(() => setImportMsg(''), 4000);
              }
            }}
          />
          {saved && (
            <span className="text-sm text-green-600 font-medium">✓ Settings saved!</span>
          )}
          {importMsg && (
            <span className="text-sm text-green-600 font-medium">{importMsg}</span>
          )}
        </div>
      </form>
    </div>
  );
}