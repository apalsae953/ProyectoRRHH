import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';

const Login = () => {
    const [dni, setDni] = useState('');
    const [password, setPassword] = useState('');
    const [totpCode, setTotpCode] = useState('');
    const [show2faInput, setShow2faInput] = useState(false);
    const [error, setError] = useState('');

    const { login, user } = useAuth();
    const navigate = useNavigate();

    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotDni, setForgotDni] = useState('');
    const [forgotMessage, setForgotMessage] = useState({ type: '', text: '' });
    const [isForgotLoading, setIsForgotLoading] = useState(false);

    useEffect(() => {
        if (user) navigate('/');
    }, [user, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const credentials = { dni, password };
            if (show2faInput) {
                credentials.totp_code = totpCode;
            }
            await login(credentials);
            navigate('/');
        } catch (err) {
            if (err.response?.data?.requires_2fa) {
                setShow2faInput(true);
                setError('');
            } else {
                setError(err.response?.data?.message || 'Error al conectar con el servidor');
            }
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setIsForgotLoading(true);
        setForgotMessage({ type: '', text: '' });
        try {
            const response = await axios.post('/api/v1/auth/forgot-password', { dni: forgotDni });
            setForgotMessage({ type: 'success', text: response.data.message });
        } catch (err) {
            setForgotMessage({ type: 'error', text: err.response?.data?.message || 'Error al solicitar el cambio' });
        } finally {
            setIsForgotLoading(false);
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
                    {!show2faInput && (
                        <>
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
                        </>
                    )}

                    {show2faInput && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Código 2FA / TOTP</label>
                            <input
                                type="text"
                                placeholder="Ej. 123456"
                                value={totpCode}
                                onChange={(e) => setTotpCode(e.target.value)}
                                required
                                maxLength={6}
                                className="w-full px-5 py-3.5 bg-gray-50 text-center tracking-[0.5em] font-mono text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-corporate focus:border-corporate outline-none transition-all shadow-inner font-bold text-xl uppercase"
                            />
                            <p className="text-xs text-slate-500 mt-2 text-center">Abre tu app de autenticación (Google Authenticator, Authy, etc) y obtén el código.</p>
                            <button
                                type="button"
                                onClick={() => { setShow2faInput(false); setTotpCode(''); }}
                                className="mt-4 w-full text-xs font-bold text-slate-500 hover:text-slate-800 underline underline-offset-2"
                            >
                                Volver al inicio normal
                            </button>
                        </div>
                    )}

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

                    <div className="text-center mt-6">
                        <button
                            type="button"
                            onClick={() => setShowForgotModal(true)}
                            className="text-corporate-dark font-bold hover:text-corporate transition-colors text-sm underline underline-offset-4 decoration-2"
                        >
                            ¿Has olvidado tu contraseña?
                        </button>
                    </div>
                </form>
            </div>

            {/* Modal de Olvido de Contraseña */}
            {showForgotModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">Recuperar Acceso</h3>
                            <button onClick={() => { setShowForgotModal(false); setForgotMessage({ type: '', text: '' }); }} className="text-slate-400 hover:text-slate-600">
                                <i className="fa-solid fa-xmark text-xl"></i>
                            </button>
                        </div>

                        <p className="text-slate-500 text-sm mb-6 font-medium">Introduce tu DNI y te enviaremos una contraseña temporal nueva a tu correo electrónico.</p>

                        {forgotMessage.text && (
                            <div className={`mb-6 p-4 rounded-xl text-xs font-bold ${forgotMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                {forgotMessage.text}
                            </div>
                        )}

                        <form onSubmit={handleForgotPassword} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Tu DNI</label>
                                <input
                                    type="text"
                                    required
                                    value={forgotDni}
                                    onChange={e => setForgotDni(e.target.value)}
                                    placeholder="12345678X"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-corporate focus:border-corporate outline-none transition-all font-bold"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isForgotLoading}
                                className="w-full bg-corporate hover:bg-corporate-dark text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group disabled:opacity-70"
                            >
                                {isForgotLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-paper-plane group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"></i>}
                                Enviar Contraseña
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;