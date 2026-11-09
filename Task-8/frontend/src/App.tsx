import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import OverviewPage from './pages/OverviewPage';
import MiddlewarePage from './pages/MiddlewarePage';
import JobsPage from './pages/JobsPage';
import CachePage from './pages/CachePage';
import HealthPage from './pages/HealthPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="middleware" element={<MiddlewarePage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="cache" element={<CachePage />} />
          <Route path="health" element={<HealthPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
