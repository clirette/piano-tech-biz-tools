import { useRef, useState } from 'react';
import { useCompanySettings } from '../../hooks/useCompanySettings';
import { Button } from '../../components/Button';
import { QrCode } from '../../components/QrCode';
import { qrMatrix } from '../../utils/qr';
import { Input } from '../../components/Input';
import { ImportButton } from '../../components/ImportButton';
import { formatPhone } from '../../utils/format';
import { exportCompanyBackup, AnyBackup, CompanyBackup } from '../../utils/backup';
import { CompanySettings, PaymentSettings } from '../../types';

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

  const { payment } = settings;

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

          {/* Online / Card */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded accent-brand-600"
                checked={payment.acceptOnlineCard}
                onChange={e => handlePayment('acceptOnlineCard', e.target.checked)}
              />
              <span className="text-sm font-medium text-slate-700">Online / Credit Card</span>
            </label>
            {payment.acceptOnlineCard && (
              <div className="ml-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Service name"
                  value={payment.onlineCardName}
                  onChange={e => handlePayment('onlineCardName', e.target.value)}
                  placeholder="Stripe, Venmo, Zelle…"
                />
                <Input
                  label="Payment link"
                  type="url"
                  value={payment.onlineCardUrl}
                  onChange={e => handlePayment('onlineCardUrl', e.target.value)}
                  placeholder="https://…"
                />
                <div className="sm:col-span-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded accent-brand-600 mt-0.5"
                      checked={payment.showPaymentQr !== false}
                      onChange={e => handlePayment('showPaymentQr', e.target.checked)}
                    />
                    <span className="text-sm text-slate-700">
                      Show a scannable QR code on invoices
                      <span className="block text-xs text-slate-400">
                        Clients can scan to open your payment link instead of typing it.
                      </span>
                    </span>
                  </label>
                  {payment.showPaymentQr !== false && payment.onlineCardUrl && (
                    <div className="mt-3 ml-7">
                      {qrMatrix(payment.onlineCardUrl) ? (
                        <div className="inline-block text-center">
                          <QrCode value={payment.onlineCardUrl} size={96} label="Payment QR preview" />
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
              </div>
            )}
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