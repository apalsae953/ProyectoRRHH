import { useState } from 'react';
import axios from '../api/axios';

const ChangePassword = () => {
    const [passwords, setPasswords] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await axios.post('/api/v1/auth/change-password', passwords);
            setMessage({ type: 'success', text: response.data.message });
            setPasswords({ current_password: '', new_password: '', new_password_confirmation: '' });
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Error al cambiar la contraseña. Verifica los datos.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-3xl shadow-xl border border-slate-100">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-corporate/10 text-corporate rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 border border-corporate/20 shadow-inner">
                    <i className="fa-solid fa-lock"></i>
                </div>
                <h2 className="text-2xl font-black text-slate-800">Seguridad</h2>
                <p className="text-slate-500 font-medium mt-1">Actualiza tu contraseña de acceso</p>
            </div>

            {message.text && (
                <div className={`mb-6 p-4 rounded-xl text-sm font-bold flex items-center gap-3 border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                    <i className={`fa-solid ${message.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Contraseña Actual</label>
                    <input
                        type="password"
                        required
                        value={passwords.current_password}
                        onChange={e => setPasswords({ ...passwords, current_password: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-corporate focus:ring-2 focus:ring-corporate/20 outline-none transition-all"
                        placeholder="••••••••"
                    />
                </div>

                <div className="h-px bg-slate-100 my-2"></div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Nueva Contraseña</label>
                    <input
                        type="password"
                        required
                        value={passwords.new_password}
                        onChange={e => setPasswords({ ...passwords, new_password: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-corporate focus:ring-2 focus:ring-corporate/20 outline-none transition-all"
                        placeholder="Mínimo 6 caracteres"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Confirmar Nueva Contraseña</label>
                    <input
                        type="password"
                        required
                        value={passwords.new_password_confirmation}
                        onChange={e => setPasswords({ ...passwords, new_password_confirmation: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-corporate focus:ring-2 focus:ring-corporate/20 outline-none transition-all"
                        placeholder="Repite la contraseña"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-corporate hover:bg-corporate-dark text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group mt-4 disabled:opacity-70"
                >
                    {loading ? (
                        <i className="fa-solid fa-spinner fa-spin"></i>
                    ) : (
                        <i className="fa-solid fa-shield-halved group-hover:scale-110 transition-transform"></i>
                    )}
                    Actualizar Contraseña
                </button>
            </form>
        </div>
    );
};

export default ChangePassword;
