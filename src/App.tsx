import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Landing from '@/pages/Landing';
import Pricing from '@/pages/Pricing';
import Dashboard from '@/pages/Dashboard';
import HistoryPage from '@/pages/History';
import Favorites from '@/pages/Favorites';
import RiskAnalysis from '@/pages/RiskAnalysis';
import ParcelComparison from '@/pages/ParcelComparison';
import AlertSettings from '@/pages/AlertSettings';
import AccountSettings from '@/pages/AccountSettings';
import AgencySettings from '@/pages/settings/AgencySettings';
import ClientsPage from '@/pages/Clients';
import UserManagement from '@/pages/admin/UserManagement';
import AdManagement from '@/pages/admin/AdManagement';
import AdRequests from '@/pages/admin/AdRequests';
import Advertise from '@/pages/Advertise';
import CheckoutSuccess from '@/pages/CheckoutSuccess';
import ReportsDashboard from '@/pages/ReportsDashboard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RequireAuth from '@/components/features/RequireAuth';

function App() {
  return (
    <BrowserRouter>
      <Toaster richColors position="top-right" />
      <Routes>
        {/* Public pages */}
        <Route path="/" element={<Landing />} />
        <Route path="/pricing" element={<Pricing />} />

        {/* Protected dashboard pages (require Clerk auth) */}
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/history"
          element={
            <RequireAuth>
              <DashboardLayout>
                <HistoryPage />
              </DashboardLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/favorites"
          element={
            <RequireAuth>
              <DashboardLayout>
                <Favorites />
              </DashboardLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/risk-analysis"
          element={
            <RequireAuth>
              <DashboardLayout>
                <RiskAnalysis />
              </DashboardLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/comparison"
          element={
            <RequireAuth>
              <DashboardLayout>
                <ParcelComparison />
              </DashboardLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/alerts"
          element={
            <RequireAuth>
              <DashboardLayout>
                <AlertSettings />
              </DashboardLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <DashboardLayout>
                <AccountSettings />
              </DashboardLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/settings/agencies"
          element={
            <RequireAuth>
              <DashboardLayout>
                <AgencySettings />
              </DashboardLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/clients"
          element={
            <RequireAuth>
              <DashboardLayout>
                <ClientsPage />
              </DashboardLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RequireAuth>
              <DashboardLayout>
                <UserManagement />
              </DashboardLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/ads"
          element={
            <RequireAuth>
              <DashboardLayout>
                <AdManagement />
              </DashboardLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/reports"
          element={
            <RequireAuth>
              <DashboardLayout>
                <ReportsDashboard />
              </DashboardLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/advertise"
          element={
            <RequireAuth>
              <DashboardLayout>
                <Advertise />
              </DashboardLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/ad-requests"
          element={
            <RequireAuth>
              <DashboardLayout>
                <AdRequests />
              </DashboardLayout>
            </RequireAuth>
          }
        />
        {/* Stripe checkout success — public, no layout needed */}
        <Route path="/checkout/success" element={<CheckoutSuccess />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
