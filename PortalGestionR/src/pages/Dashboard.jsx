import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';
import { maskDni } from '../utils/formatters';

const Dashboard = () => {
    const { user } = useAuth(); // Quitamos el logout, que ya se usa en el Layout

    const isAdmin = user?.roles?.some(r => r && (r === 'admin' || r === 'hr_director' || r.name === 'admin' || r.name === 'hr_director'));

    return (
        <div className="animate-fade-in pb-10">

            {/* Banner de Bienvenida Premium */}
            <div className="relative bg-[#0F172A] rounded-3xl p-8 md:p-10 shadow-2xl mb-8 overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-corporate to-purple-600 opacity-20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 transition-transform duration-700 group-hover:scale-110"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500 opacity-10 blur-2xl rounded-full -translate-x-1/2 translate-y-1/2"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <span className="inline-block py-1 px-3 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-semibold tracking-wider mb-4 uppercase">Visión General</span>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight">Bienvenido, {user?.name}</h2>
                        <p className="text-slate-400 text-lg max-w-xl font-medium">Aquí tienes el resumen de tu perfil y acceso a las herramientas de gestión de Globomatik.</p>
                    </div>
                    <div className="hidden lg:block">
                        <div className="w-16 h-16 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center text-corporate-light">
                            <i className="fa-solid fa-chart-line text-2xl"></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alerta si es Administrador */}
            {isAdmin && (
                <div className="bg-gradient-to-r from-amber-50 to-white border border-amber-200/60 rounded-2xl p-4 md:p-5 mb-10 flex gap-4 items-center shadow-sm relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400"></div>
                    <div className="w-10 h-10 rounded-full bg-amber-100/50 flex items-center justify-center text-amber-600 shrink-0 border border-amber-200/50">
                        <i className="fa-solid fa-shield-halved text-lg"></i>
                    </div>
                    <div>
                        <h3 className="font-bold text-amber-900 text-sm md:text-base">Modo Administrador</h3>
                        <p className="text-amber-700/80 text-xs md:text-sm mt-0.5 font-medium">Acceso sin restricciones al portal autorizado.</p>
                    </div>
                </div>
            )}

            {/* Sección de Datos Personales */}
            <div className="flex items-center justify-between mb-6 px-1">
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">Perfil Profesional</h3>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-full text-xs flex items-center gap-2 border border-emerald-200/60 shadow-sm">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.5)]"></span> Conectado
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {/* Tarjeta 1 */}
                <div className="bg-white rounded-2xl p-6 border border-slate-300 shadow-md hover:shadow-lg hover:border-corporate/40 transition-all duration-300 group">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 mb-4 group-hover:bg-corporate/10 group-hover:text-corporate transition-colors">
                        <i className="fa-regular fa-id-card text-xl"></i>
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">DNI Registrado</p>
                    <p className="text-lg font-bold text-slate-800">{maskDni(user?.dni)}</p>
                </div>

                {/* Tarjeta 2 */}
                <div className="bg-white rounded-2xl p-6 border border-slate-300 shadow-md hover:shadow-lg hover:border-corporate/40 transition-all duration-300 group">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 mb-4 group-hover:bg-corporate/10 group-hover:text-corporate transition-colors">
                        <i className="fa-regular fa-envelope text-xl"></i>
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Correo Electrónico</p>
                    <p className="text-sm font-bold text-slate-800 truncate" title={user?.email}>{user?.email}</p>
                </div>

                {/* Tarjeta 3 */}
                <div className="bg-white rounded-2xl p-6 border border-slate-300 shadow-md hover:shadow-lg hover:border-corporate/40 transition-all duration-300 group">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 mb-4 group-hover:bg-corporate/10 group-hover:text-corporate transition-colors">
                        <i className="fa-solid fa-briefcase text-xl"></i>
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Puesto Actual</p>
                    <p className="text-lg font-bold text-slate-800">{user?.position?.name || 'Pendiente'}</p>
                </div>

                {/* Tarjeta 4 */}
                <div className="bg-white rounded-2xl p-6 border border-slate-300 shadow-md hover:shadow-lg hover:border-corporate/40 transition-all duration-300 group">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 mb-4 group-hover:bg-corporate/10 group-hover:text-corporate transition-colors">
                        <i className="fa-regular fa-building text-xl"></i>
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Departamento</p>
                    <p className="text-lg font-bold text-slate-800">{user?.department_id ? 'Dep. #' + user.department_id : 'No asignado'}</p>
                </div>
            </div>

        </div>
    );
};

export default Dashboard;