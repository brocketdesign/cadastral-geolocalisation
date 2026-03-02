import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from '@/pages/Landing';
import Pricing from '@/pages/Pricing';
import Dashboard from '@/pages/Dashboard';
import HistoryPage from '@/pages/History';
import Favorites from '@/pages/Favorites';
import DashboardLayout from '@/components/layout/DashboardLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public pages */}
        <Route path="/" element={<Landing />} />
        <Route path="/pricing" element={<Pricing />} />

        {/* Dashboard pages (with sidebar layout) */}
        <Route
          path="/dashboard"
          element={
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          }
        />
        <Route
          path="/history"
          element={
            <DashboardLayout>
              <HistoryPage />
            </DashboardLayout>
          }
        />
        <Route
          path="/favorites"
          element={
            <DashboardLayout>
              <Favorites />
            </DashboardLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
