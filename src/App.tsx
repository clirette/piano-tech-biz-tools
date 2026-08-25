import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './features/home/HomePage';
import { EstimatesPage } from './features/estimates/EstimatesPage';
import { EstimateEditorPage } from './features/estimates/EstimateEditorPage';
import { EstimatePreviewPage } from './features/estimates/EstimatePreviewPage';
import { InvoicesPage } from './features/invoices/InvoicesPage';
import { InvoiceEditorPage } from './features/invoices/InvoiceEditorPage';
import { InvoicePreviewPage } from './features/invoices/InvoicePreviewPage';
import { CompanySettingsPage } from './features/company/CompanySettingsPage';
import { ToolsPage } from './features/tools/ToolsPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="estimates" element={<EstimatesPage />} />
          <Route path="estimates/:id" element={<EstimateEditorPage />} />
          <Route path="estimates/:id/preview" element={<EstimatePreviewPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="invoices/:id" element={<InvoiceEditorPage />} />
          <Route path="invoices/:id/preview" element={<InvoicePreviewPage />} />
          <Route path="tools" element={<ToolsPage />} />
          <Route path="settings" element={<CompanySettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
