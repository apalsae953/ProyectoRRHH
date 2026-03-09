import { useAuth } from '../context/AuthContext';
import { Outlet, Link, useLocation } from 'react-router-dom';

const AdminLayout = () => {
    const { user, logout } = useAuth();
    const isAdmin = user && user.roles && user.roles.some(r => r === 'admin' || r === 'hr_director' || r.name === 'admin' || r.name === 'hr_director');
    const location = useLocation(); // Para saber en qué página estamos y pintar el botón activo
    const displayRole = user?.roles?.some(r => r === 'admin' || r.name === 'admin') ? 'Administrador' :
        user?.roles?.some(r => r === 'hr_director' || r.name === 'hr_director') ? 'RRHH' : 'Empleado';

    return (
        <div className="flex h-screen bg-slate-50 font-sans selection:bg-corporate/20 selection:text-corporate-dark">
            {/* ... Resto del Layout ... */}
            <aside className="w-[280px] bg-[#0A0F1C] text-slate-300 flex-col border-r border-slate-800/50 z-20 hidden md:flex transition-all duration-300">
                <div className="h-20 px-6 border-b border-slate-800/50 flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-corporate to-[#2e4c9c] rounded-xl flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(var(--color-corporate),0.3)] shrink-0">G</div>
                    <span className="text-xl font-bold tracking-tight text-white">Globomatik</span>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
                    <Link to="/" className={'flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-300 group ' + (location.pathname === '/' ? 'bg-corporate/10 text-white shadow-inner border border-corporate/20' : 'hover:bg-white/5 hover:text-white')}>
                        <i className={'fa-solid fa-house transition-transform duration-300 text-lg ' + (location.pathname === '/' ? 'text-corporate scale-110' : 'text-slate-500 group-hover:text-slate-300')}></i>
                        Inicio
                    </Link>
                    <Link to="/empleados" className={'flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-300 group ' + (location.pathname === '/empleados' ? 'bg-corporate/10 text-white shadow-inner border border-corporate/20' : 'hover:bg-white/5 hover:text-white')}>
                        <i className={'fa-solid fa-users transition-transform duration-300 text-lg ' + (location.pathname === '/empleados' ? 'text-corporate scale-110' : 'text-slate-500 group-hover:text-slate-300')}></i>
                        Empleados
                    </Link>
                    <Link to="/vacaciones" className={'flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-300 group ' + (location.pathname === '/vacaciones' ? 'bg-corporate/10 text-white shadow-inner border border-corporate/20' : 'hover:bg-white/5 hover:text-white')}>
                        <i className={'fa-solid fa-plane transition-transform duration-300 text-lg ' + (location.pathname === '/vacaciones' ? 'text-corporate scale-110' : 'text-slate-500 group-hover:text-slate-300')}></i>
                        Vacaciones
                    </Link>
                    {isAdmin && (
                        <>
                            <Link to="/gestion-vacaciones" className={'flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-300 group ' + (location.pathname === '/gestion-vacaciones' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'hover:bg-white/5 hover:text-white')}>
                                <i className={'fa-solid fa-scale-balanced transition-transform duration-300 text-lg ' + (location.pathname === '/gestion-vacaciones' ? 'text-amber-700 scale-110' : 'text-slate-500 group-hover:text-slate-300')}></i>
                                Gestión Vacaciones
                            </Link>

                            <Link to="/organizacion" className={'flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-300 group ' + (location.pathname === '/organizacion' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'hover:bg-white/5 hover:text-white')}>
                                <i className={'fa-solid fa-sitemap transition-transform duration-300 text-lg ' + (location.pathname === '/organizacion' ? 'text-purple-700 scale-110' : 'text-slate-500 group-hover:text-slate-300')}></i>
                                Organización
                            </Link>
                        </>
                    )}
                </nav>

                <Link to="/perfil" className={'flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-300 group ' + (location.pathname === '/perfil' ? 'bg-corporate/10 text-white shadow-inner border border-corporate/20 mt-2' : 'hover:bg-white/5 hover:text-white mt-2')}>
                    <i className={'fa-solid fa-user transition-transform duration-300 text-lg ' + (location.pathname === '/perfil' ? 'text-corporate scale-110' : 'text-slate-500 group-hover:text-slate-300')}></i>
                    Mi Perfil
                </Link>

                <Link to="/seguridad" className={'flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-300 group ' + (location.pathname === '/seguridad' ? 'bg-slate-800 text-white shadow-inner border border-slate-700 mt-2' : 'hover:bg-white/5 hover:text-white mt-2')}>
                    <i className={'fa-solid fa-shield-halved transition-transform duration-300 text-lg ' + (location.pathname === '/seguridad' ? 'text-corporate scale-110' : 'text-slate-500 group-hover:text-slate-300')}></i>
                    Seguridad
                </Link>

                <button onClick={logout} className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-white hover:bg-white/5 py-3.5 rounded-xl transition-all duration-300 font-medium group text-sm border-t border-slate-800/50 mt-4">
                    <i className="fa-solid fa-arrow-right-from-bracket transition-transform group-hover:-translate-x-1 text-lg"></i>
                    Cerrar Sesión
                </button>
            </aside>

            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">

                {/* Cabecera*/}
                <header className="h-20 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-end px-10 shrink-0 sticky top-0 z-10 transition-all gap-6">

                    <Link to="/perfil" className="flex items-center gap-5 cursor-pointer group">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-slate-800 group-hover:text-corporate transition-colors">{user.name} {user.surname}</p>
                            <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">{displayRole}</p>
                        </div>
                        <div className="relative">
                            <div className="w-11 h-11 bg-corporate text-white rounded-full flex items-center justify-center font-bold shadow-md ring-4 ring-white transition-transform group-hover:scale-105 overflow-hidden">
                                {user.photo ? <img src={user.photo} alt="Profile" className="w-full h-full object-cover" /> : <>{user.name.charAt(0)}{user.surname.charAt(0)}</>}
                            </div>
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                        </div>
                    </Link>
                </header>

                {/* CONTENEDOR DE LA PÁGINA */}
                <div className="flex-1 overflow-auto p-6 md:p-10 scroll-smooth">
                    <div className="max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;