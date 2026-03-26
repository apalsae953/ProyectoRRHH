import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../api/axios';
import CommandPalette from '../components/CommandPalette';

const AdminLayout = () => {
    const { user, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    // Estado de Notificaciones (Vaciamos por defecto para cargar reales)
    const [notifications, setNotifications] = useState([]);
    const navigate = useNavigate();

    // Cargar Notificaciones Reales
    const fetchNotifications = async () => {
        try {
            const res = await axios.get('/api/v1/notifications');
            const newNotifications = Array.isArray(res.data) ? res.data : [];
            
            // Si hay notificaciones nuevas respecto al estado anterior, podríamos mostrar un aviso visual rápido
            setNotifications(newNotifications);
        } catch (error) {
            console.error('Error cargando notificaciones:', error);
            setNotifications([]); 
        }
    };

    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        const handleRefresh = () => fetchNotifications();
        const handleToast = (e) => showToast(e.detail.message, e.detail.type);
        
        window.addEventListener('refresh-notifications', handleRefresh);
        window.addEventListener('show-toast', handleToast);
        
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        
        return () => {
            window.removeEventListener('refresh-notifications', handleRefresh);
            window.removeEventListener('show-toast', handleToast);
            clearInterval(interval);
        };
    }, []);

    const handleNotificationClick = async (n) => {
        try {
            // Marcar como leída en backend
            await axios.patch(`/api/v1/notifications/${n.id}/read`);
            
            // Navegar a la sección y actualizar estado local
            navigate(n.link || '/');
            setNotifications(prev => prev.filter(notif => notif.id !== n.id));
            setShowNotifications(false);
        } catch (error) {
            console.error('Error marcando notificación:', error);
        }
    };

    const handleClearAll = async (e) => {
        e.stopPropagation();
        try {
            await axios.post('/api/v1/notifications/clear-all');
            setNotifications([]);
            setShowNotifications(false);
        } catch (error) {
            console.error('Error limpiando notificaciones:', error);
        }
    };

    // Helper para formatear fecha parecida al mock (evitando crashes con fechas inválidas)
    const formatTime = (dateStr) => {
        if (!dateStr) return 'Reciente';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'Reciente';
        
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / 60000);
        
        if (diffInMinutes < 1) return 'Ahora';
        if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `Hace ${diffInHours} horas`;
        return date.toLocaleDateString();
    };

    // Cerrar al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            const dropdown = document.getElementById('notifications-dropdown');
            const bell = document.getElementById('bell-button');
            if (showNotifications && dropdown && !dropdown.contains(event.target) && !bell.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showNotifications]);

    // Mapeo de colores para Tailwind (evitando clases dinámicas prohíbidas)
    const colorClasses = {
        emerald: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
        blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
        amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
        purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
        slate: "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300"
    };

    useEffect(() => {
        // Inicializar dark mode desde localStorage
        if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
        } else {
            setIsDarkMode(false);
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleDarkMode = () => {
        if (isDarkMode) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }
        setIsDarkMode(!isDarkMode);
    };
    
    const isAdmin = user?.roles?.some(r => r && (r === 'admin' || r === 'hr_director' || r.name === 'admin' || r.name === 'hr_director'));
    const location = useLocation(); 
    
    const displayRole = user?.roles?.some(r => r && (r === 'admin' || r.name === 'admin')) ? 'Administrador' :
        user?.roles?.some(r => r && (r === 'hr_director' || r.name === 'hr_director')) ? 'RRHH' : 'Empleado';

    // Cerrar menú móvil al cambiar de ruta
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);
    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900 font-sans selection:bg-corporate/20 selection:text-corporate-dark transition-colors duration-300">
            <CommandPalette />
            {/* Overlay para móvil */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 md:hidden animate-fade-in"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <aside className={`
                fixed md:relative w-[280px] bg-[#0A0F1C] text-slate-300 flex flex-col border-r border-slate-800/50 z-40 h-full transition-all duration-300 
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
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
                        Mis Vacaciones y HE
                    </Link>
                    <Link to="/calendario" className={'flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-300 group ' + (location.pathname === '/calendario' ? 'bg-corporate/10 text-white shadow-inner border border-corporate/20' : 'hover:bg-white/5 hover:text-white')}>
                        <i className={'fa-solid fa-calendar-days transition-transform duration-300 text-lg ' + (location.pathname === '/calendario' ? 'text-corporate scale-110' : 'text-slate-500 group-hover:text-slate-300')}></i>
                        Calendario
                    </Link>

                    <Link to="/noticias" className={'flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-300 group ' + (location.pathname === '/noticias' ? 'bg-corporate/10 text-white shadow-inner border border-corporate/20' : 'hover:bg-white/5 hover:text-white')}>
                        <i className={'fa-solid fa-newspaper transition-transform duration-300 text-lg ' + (location.pathname === '/noticias' ? 'text-corporate scale-110' : 'text-slate-500 group-hover:text-slate-300')}></i>
                        Tablón de Anuncios
                    </Link>

                    <Link to="/documentos" className={'flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-300 group ' + (location.pathname === '/documentos' ? 'bg-corporate/10 text-white shadow-inner border border-corporate/20' : 'hover:bg-white/5 hover:text-white')}>
                        <i className={'fa-solid fa-file-invoice transition-transform duration-300 text-lg ' + (location.pathname === '/documentos' ? 'text-corporate scale-110' : 'text-slate-500 group-hover:text-slate-300')}></i>
                        Nóminas y Docs
                    </Link>
                    {isAdmin && (
                        <>
                            <Link to="/gestion-vacaciones" className={'flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-300 group ' + (location.pathname === '/gestion-vacaciones' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50' : 'hover:bg-white/5 hover:text-white')}>
                                <i className={'fa-solid fa-scale-balanced transition-transform duration-300 text-lg ' + (location.pathname === '/gestion-vacaciones' ? 'text-amber-700 dark:text-amber-400 scale-110' : 'text-slate-500 group-hover:text-slate-300')}></i>
                                Gestión Vacaciones y HE
                            </Link>

                            <Link to="/organizacion" className={'flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-300 group ' + (location.pathname === '/organizacion' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900/50' : 'hover:bg-white/5 hover:text-white')}>
                                <i className={'fa-solid fa-sitemap transition-transform duration-300 text-lg ' + (location.pathname === '/organizacion' ? 'text-purple-700 dark:text-purple-400 scale-110' : 'text-slate-500 group-hover:text-slate-300')}></i>
                                Organización
                            </Link>

                            <Link to="/reportes" className={'flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-300 group ' + (location.pathname === '/reportes' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50' : 'hover:bg-white/5 hover:text-white')}>
                                <i className={'fa-solid fa-chart-line transition-transform duration-300 text-lg ' + (location.pathname === '/reportes' ? 'text-emerald-700 dark:text-emerald-400 scale-110' : 'text-slate-500 group-hover:text-slate-300')}></i>
                                Reportes
                            </Link>

                            <Link to="/control-horario" className={'flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-300 group ' + (location.pathname === '/control-horario' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50' : 'hover:bg-white/5 hover:text-white')}>
                                <i className={'fa-solid fa-clock transition-transform duration-300 text-lg ' + (location.pathname === '/control-horario' ? 'text-indigo-700 dark:text-indigo-400 scale-110' : 'text-slate-500 group-hover:text-slate-300')}></i>
                                Control Horario (Fichajes)
                            </Link>
                        </>
                    )}
                </nav>

                {/* Sección de Usuario (Fija abajo) */}
                <div className="px-4 py-4 border-t border-slate-800/50 space-y-1">
                    <Link to="/perfil" className={'flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 group ' + (location.pathname === '/perfil' ? 'bg-corporate/10 text-white shadow-inner border border-corporate/20' : 'hover:bg-white/5 hover:text-white')}>
                        <i className={'fa-solid fa-user transition-transform duration-300 text-lg ' + (location.pathname === '/perfil' ? 'text-corporate scale-110' : 'text-slate-500 group-hover:text-slate-300')}></i>
                        <span className="text-sm">Mi Perfil</span>
                    </Link>

                    <Link to="/seguridad" className={'flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 group ' + (location.pathname === '/seguridad' ? 'bg-slate-800 text-white shadow-inner border border-slate-700' : 'hover:bg-white/5 hover:text-white')}>
                        <i className={'fa-solid fa-shield-halved transition-transform duration-300 text-lg ' + (location.pathname === '/seguridad' ? 'text-corporate scale-110' : 'text-slate-500 group-hover:text-slate-300')}></i>
                        <span className="text-sm">Seguridad</span>
                    </Link>
                </div>

                {/* Botón Cerrar Sesión (En la punta abajo) */}
                <div className="mt-auto px-4 pb-6 pt-2">
                    <button 
                        onClick={logout} 
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 font-bold group hover:bg-red-500 hover:text-white text-red-300 bg-red-500/10 border border-red-500/20 shadow-lg shadow-red-900/20"
                    >
                        <i className="fa-solid fa-arrow-right-from-bracket transition-transform group-hover:-translate-x-1 text-lg"></i>
                        <span className="text-sm">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">

                {/* Cabecera*/}
                <header className="h-20 bg-white/70 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between px-6 md:px-10 shrink-0 sticky top-0 z-[100] transition-all gap-4">
                    {/* Botón Hamburguesa Móvil (Alineado a la izquierda en móvil) */}
                    <div className="flex items-center md:hidden">
                        <button 
                            className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-corporate hover:text-white transition-all shadow-sm"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <i className="fa-solid fa-bars-staggered text-lg"></i>
                        </button>
                    </div>

                    {/* Controles de la Derecha (Alineados a la derecha en ambos dispositivos) */}
                    <div className="flex items-center gap-4 ml-auto">
                        {/* Dark Mode Toggle */}
                        <button
                            onClick={toggleDarkMode}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-corporate dark:hover:text-corporate-light transition-colors"
                        >
                            <i className={`fa-solid ${isDarkMode ? 'fa-sun' : 'fa-moon'} text-lg`}></i>
                        </button>

                        {/* Notifications */}
                        <div className="relative">
                            <button
                                id="bell-button"
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-corporate dark:hover:text-corporate-light transition-colors relative"
                            >
                                <i className="fa-regular fa-bell text-lg"></i>
                                {notifications?.length > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center animate-bounce-subtle">
                                        {notifications.length > 9 ? '9+' : notifications.length}
                                    </span>
                                )}
                            </button>

                            {/* Dropdown Notificaciones */}
                            <AnimatePresence>
                                {showNotifications && (
                                    <motion.div
                                        id="notifications-dropdown"
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-700 overflow-hidden z-[1001]"
                                    >
                                        <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                                            <h4 className="font-bold text-slate-800 dark:text-white">Notificaciones</h4>
                                            <span className="text-xs font-bold bg-corporate text-white px-2 py-0.5 rounded-full">{notifications?.length || 0} nuevas</span>
                                        </div>
                                        <div className="max-h-80 overflow-y-auto">
                                            {!notifications || notifications.length === 0 ? (
                                                <div className="p-6 text-center text-slate-500 dark:text-slate-400">
                                                    <i className="fa-regular fa-bell-slash text-2xl mb-2 opacity-50"></i>
                                                    <p className="text-sm font-medium">No hay notificaciones</p>
                                                </div>
                                            ) : (
                                                notifications?.map(n => (
                                                    <div key={n.id} onClick={() => handleNotificationClick(n)} className="p-4 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex gap-3 cursor-pointer group">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colorClasses[n.color] || colorClasses.slate}`}>
                                                            <i className={`fa-solid ${n.icon || 'fa-bell'}`}></i>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-corporate dark:group-hover:text-corporate-light transition-colors leading-tight">{n.text}</p>
                                                            <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 block">{formatTime(n.created_at)}</span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        {notifications?.length > 0 && (
                                            <div onClick={handleClearAll} className="p-3 text-center bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer border-t border-slate-100 dark:border-slate-700">
                                                <span className="text-sm font-bold text-corporate dark:text-corporate-light">Limpiar todas</span>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>


                    <Link to="/perfil" className="flex items-center gap-5 cursor-pointer group">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-corporate dark:group-hover:text-corporate-light transition-colors">{user?.name} {user?.surname}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide mt-0.5">{displayRole}</p>
                        </div>
                        <div className="relative">
                            <div className="w-11 h-11 bg-corporate text-white rounded-full flex items-center justify-center font-bold shadow-md ring-4 ring-white dark:ring-slate-800 transition-transform group-hover:scale-105 overflow-hidden">
                                {user?.photo ? (
                                    <img src={user?.photo} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <>{(user?.name || '?').charAt(0)}{(user?.surname || '?').charAt(0)}</>
                                )}
                            </div>
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full"></span>
                        </div>
                    </Link>
                    </div>
                </header>

                {/* Contenedor Toast Simple */}
                <AnimatePresence>
                    {toast && (
                        <motion.div 
                            initial={{ opacity: 0, y: 50, x: '-50%' }}
                            animate={{ opacity: 1, y: 0, x: '-50%' }}
                            exit={{ opacity: 0, y: 50, x: '-50%' }}
                            className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[10001] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md ${
                                toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white' : 
                                toast.type === 'error' ? 'bg-red-500/90 border-red-400 text-white' : 
                                'bg-slate-800/90 border-slate-700 text-white'
                            }`}
                        >
                            <i className={`fa-solid ${toast.type === 'success' ? 'fa-circle-check' : toast.type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-info'}`}></i>
                            <span className="font-bold text-sm tracking-wide">{toast.message}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* CONTENEDOR DE LA PÁGINA */}
                <div className={`flex-1 ${location.pathname === '/calendario' ? 'overflow-hidden' : 'overflow-auto'} p-6 md:p-10 scroll-smooth`}>
                    <div className="max-w-7xl mx-auto w-full">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={location.pathname}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                            >
                                <Outlet />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;