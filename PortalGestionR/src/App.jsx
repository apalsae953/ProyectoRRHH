import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={<Login />} />

        {/* Rutas Privadas (Protegidas) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          {/* Aquí añadiremos más adelante /empleados, /vacaciones, etc. */}
        </Route>
        
        {/* Ruta para capturar URLs que no existen (Error 404) */}
        <Route path="*" element={<div style={{ padding: '50px', textAlign: 'center' }}><h2>Error 404: Página no encontrada</h2></div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;