import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';
import { maskDni } from '../utils/formatters';

const Profile = () => {
    const { user, login } = useAuth();

    const isAdminOrHr = user?.roles?.some(r => typeof r === 'string' ? ['admin', 'hr_director'].includes(r) : ['admin', 'hr_director'].includes(r?.name));

    const [formData, setFormData] = useState({
        name: user?.name || '',
        surname: user?.surname || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || '',
    });
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(user?.photo || '');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [twoFactorActive, setTwoFactorActive] = useState(!!user?.two_factor_secret);
    const [twoFactorQr, setTwoFactorQr] = useState('');
    const [twoFactorSecret, setTwoFactorSecret] = useState('');
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [twoFactorLoading, setTwoFactorLoading] = useState(false);
    const [twoFactorMessage, setTwoFactorMessage] = useState({ type: '', text: '' });

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('surname', formData.surname);
            formDataToSend.append('email', formData.email);
            formDataToSend.append('phone', formData.phone || '');
            formDataToSend.append('address', formData.address || '');

            if (photoFile) {
                formDataToSend.append('photo', photoFile);
            }

            const response = await axios.post('/api/v1/auth/profile', formDataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setMessage({ type: 'success', text: response.data.message });
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            const errData = error.response?.data;
            let errorMsg = 'Error al actualizar el perfil.';
            if (errData?.errors) {
                const firstErrorKey = Object.keys(errData.errors)[0];
                errorMsg = errData.errors[firstErrorKey][0];
            } else if (errData?.message) {
                errorMsg = errData.message;
            }
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    const handleEnable2FA = async () => {
        setTwoFactorLoading(true);
        setTwoFactorMessage({ type: '', text: '' });
        try {
            const response = await axios.post('/api/v1/auth/2fa/enable');
            setTwoFactorQr(response.data.qr_svg);
            setTwoFactorSecret(response.data.secret);
        } catch (error) {
            setTwoFactorMessage({ type: 'error', text: 'Error al iniciar la activación de 2FA.' });
        } finally {
            setTwoFactorLoading(false);
        }
    };

    const handleConfirm2FA = async () => {
        setTwoFactorLoading(true);
        setTwoFactorMessage({ type: '', text: '' });
        try {
            const response = await axios.post('/api/v1/auth/2fa/confirm', {
                secret: twoFactorSecret,
                totp_code: twoFactorCode
            });
            setTwoFactorActive(true);
            setTwoFactorQr('');
            setTwoFactorSecret('');
            setTwoFactorCode('');
            setTwoFactorMessage({ type: 'success', text: response.data.message });
        } catch (error) {
            setTwoFactorMessage({ type: 'error', text: error.response?.data?.message || 'Código incorrecto.' });
        } finally {
            setTwoFactorLoading(false);
        }
    };

    const handleDisable2FA = async () => {
        if (!window.confirm('¿Estás seguro de que deseas desactivar la autenticación de doble factor?')) return;
        setTwoFactorLoading(true);
        setTwoFactorMessage({ type: '', text: '' });
        try {
            const response = await axios.post('/api/v1/auth/2fa/disable');
            setTwoFactorActive(false);
            setTwoFactorMessage({ type: 'success', text: response.data.message });
        } catch (error) {
            setTwoFactorMessage({ type: 'error', text: 'Error al desactivar 2FA.' });
        } finally {
            setTwoFactorLoading(false);
        }
    };

    const displayRole = user?.roles?.some(r => r && (r === 'admin' || r.name === 'admin')) ? 'Administrador' :
        user?.roles?.some(r => r && (r === 'hr_director' || r.name === 'hr_director')) ? 'Recursos Humanos' : 'Empleado';

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden mb-6 transition-colors duration-300">
                <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 transition-colors">
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight transition-colors">Mi Perfil</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium transition-colors">Gestiona tu información personal y completa tu perfil.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Columna Izquierda: Foto y Rol */}
                <div className="col-span-1">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center transition-colors duration-300">
                        <div className="w-32 h-32 rounded-full bg-corporate text-white flex items-center justify-center text-4xl font-bold shadow-xl mb-6 relative overflow-hidden ring-4 ring-corporate/20 dark:ring-corporate/40 transition-shadow">
                            {photoPreview ? (
                                <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <>{user?.name?.charAt(0)}{user?.surname?.charAt(0)}</>
                            )}
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white transition-colors">{user?.name} {user?.surname}</h3>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 transition-colors">{user?.email}</p>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5 transition-colors">DNI</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors">{maskDni(user?.dni)}</p>
                        <div className="mt-4 px-4 py-1.5 bg-corporate/10 dark:bg-corporate/20 text-corporate dark:text-corporate-light font-bold text-sm rounded-full transition-colors">
                            {displayRole}
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Formulario */}
                <div className="col-span-1 md:col-span-2">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-8 transition-colors duration-300">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-700 pb-4 transition-colors">
                            Información Personal
                        </h3>

                        {message.text && (
                            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 font-medium text-sm border transition-colors ${message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'}`}>
                                <i className={`fa-solid ${message.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'} text-lg`}></i>
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 transition-colors">Nombre</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-corporate/20 dark:focus:ring-corporate/40 focus:border-corporate dark:focus:border-corporate transition-all disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-400"
                                        required
                                        disabled={!isAdminOrHr}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 transition-colors">Apellidos</label>
                                    <input
                                        type="text"
                                        value={formData.surname}
                                        onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-corporate/20 dark:focus:ring-corporate/40 focus:border-corporate dark:focus:border-corporate transition-all disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-400"
                                        required
                                        disabled={!isAdminOrHr}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 transition-colors">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-corporate/20 dark:focus:ring-corporate/40 focus:border-corporate dark:focus:border-corporate transition-all disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-400"
                                        required
                                        disabled={!isAdminOrHr}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 transition-colors">Teléfono de Contacto</label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-corporate/20 dark:focus:ring-corporate/40 focus:border-corporate dark:focus:border-corporate transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 transition-colors">Dirección</label>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-corporate/20 dark:focus:ring-corporate/40 focus:border-corporate dark:focus:border-corporate transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 transition-colors">Foto de Perfil</label>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                    <label className="cursor-pointer bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-600 font-bold text-sm text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-2 shadow-sm">
                                        <i className="fa-solid fa-cloud-arrow-up"></i>
                                        Subir Foto
                                        <input
                                            type="file"
                                            accept="image/png, image/jpeg, image/jpg, image/webp"
                                            onChange={handlePhotoChange}
                                            className="hidden"
                                        />
                                    </label>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium transition-colors">
                                        {photoFile ? photoFile.name : 'Formatos recomendados: JPG, PNG, WEBP. Máx. 2MB.'}
                                    </span>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end border-t border-slate-100 dark:border-slate-700 mt-6 transition-colors">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-3 rounded-xl font-bold bg-corporate hover:bg-corporate-dark text-white transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-70"
                                >
                                    {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-save"></i>}
                                    Guardar Cambios
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* SECCIÓN 2FA */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-8 mt-8 transition-colors duration-300">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-700 pb-4 flex items-center gap-2 transition-colors">
                            <i className="fa-solid fa-shield-halved text-corporate dark:text-corporate-light transition-colors"></i>
                            Doble Factor de Autenticación (2FA)
                        </h3>

                        {twoFactorMessage.text && (
                            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 font-medium text-sm border transition-colors ${twoFactorMessage.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'}`}>
                                <i className={`fa-solid ${twoFactorMessage.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'} text-lg`}></i>
                                {twoFactorMessage.text}
                            </div>
                        )}

                        <div className="space-y-4">
                            {twoFactorActive ? (
                                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 transition-colors">
                                    <div>
                                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2 transition-colors">
                                            <i className="fa-solid fa-check-circle"></i> 2FA Activado
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 transition-colors">Tu cuenta está protegida con autenticación de dos pasos.</p>
                                    </div>
                                    <button
                                        onClick={handleDisable2FA}
                                        disabled={twoFactorLoading}
                                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl font-bold text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-sm disabled:opacity-50"
                                    >
                                        Desactivar 2FA
                                    </button>
                                </div>
                            ) : twoFactorQr ? (
                                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center text-center space-y-4 transition-colors">
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors">1. Escanea este código QR con tu app de autenticación (Google Authenticator, Authy, etc).</p>
                                    <div className="bg-white p-3 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm" dangerouslySetInnerHTML={{ __html: atob(twoFactorQr) }} />
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium transition-colors">O introduce este código manualmente: <span className="text-slate-700 dark:text-slate-200 font-mono font-bold bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded transition-colors">{twoFactorSecret}</span></p>

                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-4 transition-colors">2. Introduce el código de 6 dígitos generado por tu app:</p>
                                    <div className="flex gap-2 w-full max-w-xs justify-center text-center mx-auto">
                                        <input
                                            type="text"
                                            value={twoFactorCode}
                                            onChange={(e) => setTwoFactorCode(e.target.value)}
                                            maxLength={6}
                                            placeholder="Ej. 123456"
                                            className="w-full px-4 py-2 text-center tracking-[0.3em] font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-corporate dark:focus:ring-corporate-light focus:border-corporate outline-none uppercase text-lg transition-colors"
                                        />
                                    </div>
                                    <div className="flex gap-2 mt-4 justify-center">
                                        <button onClick={() => { setTwoFactorQr(''); setTwoFactorSecret(''); }} className="px-5 py-2.5 rounded-xl font-bold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition-colors text-sm">
                                            Cancelar
                                        </button>
                                        <button onClick={handleConfirm2FA} disabled={twoFactorLoading || twoFactorCode.length < 6} className="px-5 py-2.5 rounded-xl font-bold bg-corporate hover:bg-corporate-dark text-white transition-colors shadow-md text-sm disabled:opacity-50">
                                            {twoFactorLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Confirmar y Activar'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 transition-colors">
                                    <div>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors">2FA Desactivado</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 transition-colors">Aumenta la seguridad de tu cuenta solicitando un código temporal al iniciar sesión.</p>
                                    </div>
                                    <button
                                        onClick={handleEnable2FA}
                                        disabled={twoFactorLoading}
                                        className="px-4 py-2 bg-corporate text-white rounded-xl font-bold text-sm hover:bg-corporate-dark transition-colors shadow-sm disabled:opacity-50"
                                    >
                                        Activar 2FA
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
