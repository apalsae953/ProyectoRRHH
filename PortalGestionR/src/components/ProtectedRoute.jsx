import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
    const { user, loading } = useAuth();

    // Mientras React le pregunta a Laravel si hay sesión, mostramos un texto de carga
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-50">
                <i className="fa-solid fa-circle-notch fa-spin text-4xl text-corporate opacity-20"></i>
            </div>
        );
    }

    // Si no hay usuario logueado, lo redirigimos a la página de login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Si todo está bien, le dejamos pasar a las rutas hijas (Outlet)
    return <Outlet />;
};

export default ProtectedRoute;