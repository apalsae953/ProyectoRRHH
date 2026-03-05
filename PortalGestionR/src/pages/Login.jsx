import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [dni, setDni] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const { login, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) navigate('/');
    }, [user, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await login({ dni, password });
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Error al conectar con el servidor');
        }
    };

    return (
        <div className="fixed inset-0 w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-corporate-dark to-slate-800 p-4">

            {/* Tarjeta Blanca que resalta sobre el fondo oscuro */}
            <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-8 sm:p-10 transform transition-all">

                <div className="text-center mb-8">
                    {/* Icono corporativo con un pequeño giro para darle estilo */}
                    <div className="mx-auto w-16 h-16 bg-corporate text-white rounded-2xl flex items-center justify-center mb-5 shadow-lg rotate-3">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" /></svg>
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Globomatik</h1>
                    <p className="text-sm text-gray-500 font-medium mt-2">Acceso al Portal del Empleado</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">DNI</label>
                        <input
                            type="text"
                            placeholder="Ej. 12345678A"
                            value={dni}
                            onChange={(e) => setDni(e.target.value)}
                            required
                            className="w-full px-5 py-3.5 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-corporate focus:border-corporate outline-none transition-all shadow-inner font-medium text-lg"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Contraseña</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-5 py-3.5 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-corporate focus:border-corporate outline-none transition-all shadow-inner font-medium text-lg"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-3 text-red-700 text-sm font-bold rounded">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-corporate hover:bg-corporate-dark text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 mt-2 text-lg"
                    >
                        Iniciar Sesión
                    </button>
                </form>
            </div>

        </div>
    );
};

export default Login;