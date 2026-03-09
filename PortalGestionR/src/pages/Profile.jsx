import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';

const Profile = () => {
    const { user, login } = useAuth();

    const [formData, setFormData] = useState({
        name: user?.name || '',
        surname: user?.surname || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(user?.photo || '');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

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

    const displayRole = user?.roles?.some(r => r === 'admin' || r.name === 'admin') ? 'Administrador' :
        user?.roles?.some(r => r === 'hr_director' || r.name === 'hr_director') ? 'Recursos Humanos' : 'Empleado';

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden mb-6 transition-colors duration-300">
                <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Mi Perfil</h2>
                        <p className="text-slate-500 text-sm mt-1 font-medium">Gestiona tu información personal y completa tu perfil.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Columna Izquierda: Foto y Rol */}
                <div className="col-span-1">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center transition-colors duration-300">
                        <div className="w-32 h-32 rounded-full bg-corporate text-white flex items-center justify-center text-4xl font-bold shadow-xl mb-6 relative overflow-hidden ring-4 ring-corporate/20">
                            {photoPreview ? (
                                <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <>{user?.name?.charAt(0)}{user?.surname?.charAt(0)}</>
                            )}
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">{user?.name} {user?.surname}</h3>
                        <p className="text-sm font-medium text-slate-500 mt-1">{user?.email}</p>
                        <div className="mt-4 px-4 py-1.5 bg-corporate/10 text-corporate font-bold text-sm rounded-full">
                            {displayRole}
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Formulario */}
                <div className="col-span-1 md:col-span-2">
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 transition-colors duration-300">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">
                            Información Personal
                        </h3>

                        {message.text && (
                            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 font-medium text-sm border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                <i className={`fa-solid ${message.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'} text-lg`}></i>
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Nombre</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-corporate/20 focus:border-corporate transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Apellidos</label>
                                    <input
                                        type="text"
                                        value={formData.surname}
                                        onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-corporate/20 focus:border-corporate transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-corporate/20 focus:border-corporate transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Teléfono de Contacto</label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-corporate/20 focus:border-corporate transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Foto de Perfil</label>
                                <div className="flex items-center gap-4">
                                    <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 px-5 py-3 rounded-xl border border-slate-200 font-bold text-sm text-slate-700 transition-colors flex items-center gap-2 shadow-sm">
                                        <i className="fa-solid fa-cloud-arrow-up"></i>
                                        Subir Foto
                                        <input
                                            type="file"
                                            accept="image/png, image/jpeg, image/jpg, image/webp"
                                            onChange={handlePhotoChange}
                                            className="hidden"
                                        />
                                    </label>
                                    <span className="text-xs text-slate-500 font-medium">
                                        {photoFile ? photoFile.name : 'Formatos recomendados: JPG, PNG, WEBP. Máx. 2MB.'}
                                    </span>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end border-t border-slate-100 mt-6">
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
                </div>
            </div>
        </div>
    );
};

export default Profile;
