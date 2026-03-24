import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import Vacations from './pages/Vacations';
import AdminVacations from './pages/AdminVacations';
import AdminSettings from './pages/AdminSettings';
import ChangePassword from './pages/ChangePassword';
import Profile from './pages/Profile';
import Documents from './pages/Documents';
import TeamCalendar from './pages/TeamCalendar';
import Holidays from './pages/Holidays';
import Reports from './pages/Reports';
import TimeLogs from './pages/TimeLogs';
import News from './pages/News';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin/dashboard" element={<Navigate to="/" replace />} />

        {/* Rutas Protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/empleados" element={<Employees />} />
            <Route path="/vacaciones" element={<Vacations />} />
            <Route path="/calendario" element={<TeamCalendar />} />
            <Route path="/festivos" element={<Holidays />} />
            <Route path="/gestion-vacaciones" element={<AdminVacations />} />
            <Route path="/control-horario" element={<TimeLogs />} />
            <Route path="/noticias" element={<News />} />
            <Route path="/organizacion" element={<AdminSettings />} />
            <Route path="/documentos" element={<Documents />} />
            <Route path="/reportes" element={<Reports />} />
            <Route path="/seguridad" element={<ChangePassword />} />
            <Route path="/perfil" element={<Profile />} />
          </Route>
        </Route>

        <Route path="*" element={<div className="p-10 text-center"><h2>Error 404: Página no encontrada</h2></div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;