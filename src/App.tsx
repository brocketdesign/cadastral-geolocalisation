import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from '@/pages/Landing';
import Pricing from '@/pages/Pricing';
import Dashboard from '@/pages/Dashboard';
import HistoryPage from '@/pages/History';
import Favorites from '@/pages/Favorites';
import RiskAnalysis from '@/pages/RiskAnalysis';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RequireAuth from '@/components/features/RequireAuth';

function App() {
  return (
    <BrowserRouter>
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
