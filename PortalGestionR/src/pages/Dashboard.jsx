import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';
import { Link } from 'react-router-dom';
import { maskDni } from '../utils/formatters';
import { motion } from 'framer-motion';

const Dashboard = () => {
    const { user } = useAuth();
    const [balance, setBalance] = useState(null);
    const [news, setNews] = useState([]);
    const [totalOvertimeHours, setTotalOvertimeHours] = useState(0);
    const [whoIsOut, setWhoIsOut] = useState([]);
    const [loading, setLoading] = useState(true);
    const [greeting, setGreeting] = useState('');

    const isAdmin = user?.roles?.some(r => r && (r === 'admin' || r === 'hr_director' || r.name === 'admin' || r.name === 'hr_director'));

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Buenos días');
        else if (hour < 20) setGreeting('Buenas tardes');
        else setGreeting('Buenas noches');

        const fetchDashboardData = async () => {
            try {
                const response = await axios.get('/api/v1/dashboard/summary');
                const data = response.data;
                
                setBalance(data.balance);
                setNews(data.news?.data || data.news || []);
                setWhoIsOut(data.who_is_out || []);
                setTotalOvertimeHours(data.total_overtime_hours || 0);
            } catch (error) {
                console.error("Error cargando datos del dashboard", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const available = Number(balance?.dias_totales_disponibles || 0);
    const taken = Number(balance?.dias_disfrutados || 0);
    const generated = Number(balance?.dias_generados_hasta_hoy || 0);
    const carriedOver = Number(balance?.dias_arrastrados_año_anterior || 0);
    const totalPotential = generated + carriedOver;
    const remainingDays = available;
    const percentage = totalPotential > 0 ? (taken / totalPotential) * 100 : 0;

    if (loading) return (
        <div className="h-[80vh] flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-corporate border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="animate-fade-in pb-10 space-y-12">
            {/* Header / Hero Section */}
            <div className="relative min-h-[320px] rounded-[3.5rem] overflow-hidden shadow-2xl group border border-slate-200 dark:border-slate-800">
                <div className="absolute inset-0 bg-[#0F172A] dark:bg-slate-950"></div>
                 {/* Decorative Blobs */}
                <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-corporate/30 rounded-full blur-[120px] transition-all duration-1000 group-hover:bg-corporate/40"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[100px]"></div>

                <div className="relative z-10 p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12 h-full">
                    <div className="flex-1 space-y-6 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                             <span className="text-[10px] font-black text-white/80 uppercase tracking-[0.3em]">Sistema Operativo · {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</span>
                        </div>
                        
                        <div className="space-y-4">
                            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none italic">
                                {greeting}, <br className="hidden md:block"/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-corporate-light via-blue-400 to-indigo-400">
                                    {user?.name.split(' ')[0]}
                                </span>
                            </h2>
                            <p className="text-slate-400 dark:text-slate-500 text-lg md:text-xl font-medium max-w-xl">
                                Tu panel de gestión está listo. Tienes <span className="text-white font-bold">{Math.max(0, remainingDays.toFixed(1))} días</span> de vacaciones pendientes de disfrutar.
                            </p>
                        </div>

                        <div className="flex items-center gap-4 justify-center md:justify-start pt-4">
                             <button className="px-8 py-4 bg-white text-slate-900 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl">
                                Mi Expediente 
                             </button>
                        </div>
                    </div>

                    {/* Dashboard Mini Widget */}
                    <div className="hidden lg:flex w-72 h-72 bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-inner p-8 flex-col items-center justify-center relative group/widget overflow-hidden">
                         <div className="absolute inset-0 bg-gradient-to-br from-corporate/10 to-transparent pointer-events-none"></div>
                         <div className="relative w-full aspect-square">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="50%" cy="50%" r="42%" strokeWidth="12" fill="transparent" className="text-white/5" />
                                <motion.circle 
                                    cx="50%" cy="50%" r="42%" strokeWidth="12" fill="transparent" className="text-corporate-light" strokeLinecap="round" strokeDasharray="100 100"
                                    initial={{ strokeDasharray: "0 100" }} animate={{ strokeDasharray: `${percentage} 100` }} transition={{ duration: 2, delay: 0.5 }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-black text-white tracking-tighter">{percentage.toFixed(0)}%</span>
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Disfrutado</span>
                            </div>
                         </div>
                         <div className="mt-6 flex gap-4 w-full">
                             <div className="flex-1 text-center">
                                 <p className="text-[9px] font-black text-slate-500 uppercase">Usados</p>
                                 <p className="text-sm font-black text-white">{taken.toFixed(1)}</p>
                             </div>
                             <div className="w-px h-8 bg-white/10"></div>
                             <div className="flex-1 text-center">
                                 <p className="text-[9px] font-black text-slate-500 uppercase">Restan</p>
                                 <p className="text-sm font-black text-white">{remainingDays.toFixed(1)}</p>
                             </div>
                         </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Main Content Area */}
                <div className="lg:col-span-8 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-[0.03] dark:opacity-[0.07] group-hover:scale-125 transition-transform duration-500">
                                <i className="fa-solid fa-umbrella-beach text-9xl"></i>
                            </div>
                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-16 h-16 rounded-[1.5rem] bg-corporate text-white flex items-center justify-center text-2xl shadow-lg shadow-corporate/30">
                                    <i className="fa-solid fa-plane-departure"></i>
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vacaciones</h4>
                                    <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter italic">{remainingDays.toFixed(1)} <span className="text-lg text-slate-400 font-bold not-italic">días</span></p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                     <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (remainingDays / 30) * 100)}%` }} className="h-full bg-corporate transition-all duration-1000"></motion.div>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-between">
                                    <span>{taken.toFixed(1)} disfrutados</span>
                                    <span>{totalPotential.toFixed(1)} totales</span>
                                </p>
                            </div>
                        </motion.div>

                        <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-[0.03] dark:opacity-[0.07] group-hover:scale-125 transition-transform duration-500">
                                <i className="fa-solid fa-bolt text-9xl"></i>
                            </div>
                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-16 h-16 rounded-[1.5rem] bg-amber-500 text-white flex items-center justify-center text-2xl shadow-lg shadow-amber-500/30">
                                    <i className="fa-solid fa-bolt-lightning"></i>
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Horas Extra</h4>
                                    <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter italic">{totalOvertimeHours} <span className="text-lg text-slate-400 font-bold not-italic">horas</span></p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                     <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (totalOvertimeHours / 20) * 100)}%` }} className="h-full bg-amber-500 transition-all duration-1000"></motion.div>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-between">
                                    <span>Balance acumulado</span>
                                    <span>Objetivo: 20h</span>
                                </p>
                            </div>
                        </motion.div>
                    </div>

                    <TimeTracker />

                    {/* Info Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none grid grid-cols-1 md:grid-cols-2 gap-12 relative overflow-hidden">
                        <div className="absolute top-[-50%] left-[-10%] w-[400px] h-[400px] bg-corporate/5 rounded-full blur-[80px]"></div>
                        
                        <div className="space-y-8 relative z-10">
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter italic">Detalles Profesionales</h3>
                            <div className="space-y-6">
                                <div className="flex items-center gap-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-corporate shadow-sm">
                                        <i className="fa-solid fa-briefcase text-lg"></i>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cargo Actual</label>
                                        <p className="text-xs font-black text-slate-800 dark:text-white tracking-tight">{user?.position?.name || 'Cargando...'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-indigo-500 shadow-sm">
                                        <i className="fa-solid fa-id-card text-lg"></i>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Identificación</label>
                                        <p className="text-xs font-black text-slate-800 dark:text-white tracking-tight">{maskDni(user?.dni)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 relative z-10 pt-10 md:pt-0">
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter italic">Ubicación y Alta</h3>
                            <div className="space-y-6">
                                <div className="flex items-center gap-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-emerald-500 shadow-sm">
                                        <i className="fa-solid fa-building text-lg"></i>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Departamento</label>
                                        <p className="text-xs font-black text-slate-800 dark:text-white tracking-tight">{user?.department?.name || 'General'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-purple-500 shadow-sm">
                                        <i className="fa-solid fa-rocket text-lg"></i>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Incorporación</label>
                                        <p className="text-xs font-black text-slate-800 dark:text-white tracking-tight">{user?.hired_at ? new Date(user.hired_at).toLocaleDateString() : 'Activo'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="lg:col-span-4 space-y-10">
                    {/* Tablón de Noticias con Diseño Glassmorphism */}
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 border border-slate-100 dark:border-slate-800 shadow-2xl relative overflow-hidden">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter italic flex items-center gap-3">
                                 Tablón
                                 <span className="w-2 h-2 rounded-full bg-corporate"></span>
                            </h3>
                            {isAdmin && (
                                <Link to="/noticias" className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-corporate hover:text-white transition-all shadow-sm">
                                    <i className="fa-solid fa-plus text-sm"></i>
                                </Link>
                            )}
                        </div>

                        <div className="space-y-8">
                            {news.length === 0 ? (
                                <div className="py-20 text-center opacity-30">
                                    <i className="fa-solid fa-layer-group text-6xl mb-6"></i>
                                    <p className="text-sm font-black uppercase tracking-widest">Sin anuncios</p>
                                </div>
                            ) : (
                                news.slice(0, 3).map((item, idx) => (
                                    <motion.div 
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        key={item.id} 
                                        className="relative group cursor-pointer border-l-4 border-slate-100 dark:border-slate-800 hover:border-corporate pl-6 py-1 transition-all"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                             <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest ${
                                                 item.type === 'policy' ? 'bg-amber-100 text-amber-600' :
                                                 item.type === 'event' ? 'bg-purple-100 text-purple-600' :
                                                 'bg-blue-100 text-blue-600'
                                             }`}>
                                                 {item.type}
                                             </span>
                                             <span className="text-[9px] font-bold text-slate-400 italic">#{item.id}</span>
                                        </div>
                                        <h4 className="text-sm font-black text-slate-800 dark:text-white leading-tight group-hover:text-corporate transition-colors mb-2">{item.title}</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-2 leading-relaxed italic opacity-80 group-hover:opacity-100">{item.content}</p>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {news.length > 3 && (
                            <Link to="/noticias" className="mt-10 flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] hover:bg-corporate/10 hover:text-corporate transition-all">
                                Ver todo el historial
                                <i className="fa-solid fa-arrow-right-long text-[10px]"></i>
                            </Link>
                        )}
                    </div>

                    {/* Presencias */}
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 border border-slate-100 dark:border-slate-800 shadow-2xl">
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter italic mb-10">Ausencias Hoy</h3>
                        <div className="space-y-5">
                            {whoIsOut.length === 0 ? (
                                <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                                     <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center text-3xl">
                                         <i className="fa-solid fa-user-check"></i>
                                     </div>
                                     <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.3em]">Full Team Active</p>
                                </div>
                            ) : (
                                whoIsOut.map((v, i) => (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.1 }}
                                        key={v.id} 
                                        className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 group hover:scale-[1.02] transition-all"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-corporate to-indigo-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-lg shadow-corporate/20 italic group-hover:rotate-6 transition-transform">
                                            {(v.empleado?.nombre || '?').charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-slate-800 dark:text-white truncate tracking-tight">{v.empleado?.nombre}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <i className={`fa-solid ${v.type === 'sick_leave' ? 'fa-virus-covid text-red-500' : 'fa-sun text-corporate-light'} text-[10px]`}></i>
                                                <span className="text-[10px] font-bold text-slate-400 capitalize">{v.tipo === 'sick_leave' ? 'Baja' : 'Vacaciones'}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Quick Access Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <Link to="/vacaciones" className="h-32 bg-corporate rounded-[2rem] p-6 text-white flex flex-col justify-between shadow-xl shadow-corporate/20 hover:scale-[1.05] transition-all group">
                             <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl group-hover:rotate-12 transition-transform">
                                 <i className="fa-solid fa-calendar-plus"></i>
                             </div>
                             <span className="text-[10px] font-black uppercase tracking-widest italic leading-tight">Nueva <br/> Solicitud</span>
                        </Link>
                        <Link to="/documentos" className="h-32 bg-slate-800 dark:bg-slate-900 rounded-[2rem] p-6 text-white flex flex-col justify-between shadow-xl hover:scale-[1.05] transition-all group border border-white/5">
                             <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl group-hover:-rotate-12 transition-transform">
                                 <i className="fa-solid fa-file-invoice"></i>
                             </div>
                             <span className="text-[10px] font-black uppercase tracking-widest italic leading-tight">Ver <br/> Documentos</span>
                        </Link>
                    </div>
                </div>
            </div>

            {isAdmin && (
                <div className="bg-gradient-to-r from-corporate to-[#1e3a8a] rounded-[3.5rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-10 shadow-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-[80px]"></div>
                    <div className="flex items-center gap-8 relative z-10">
                        <div className="w-20 h-20 rounded-[2rem] bg-white/10 backdrop-blur-xl flex items-center justify-center text-white text-3xl shadow-2xl border border-white/20 group-hover:scale-110 transition-transform">
                            <i className="fa-solid fa-crown"></i>
                        </div>
                        <div>
                            <h4 className="text-3xl font-black tracking-tighter italic">Comité de Dirección</h4>
                            <p className="text-white/60 text-lg font-medium">Controles administrativos y reportes avanzados habilitados.</p>
                        </div>
                    </div>
                    <Link to="/gestion-vacaciones" className="px-10 py-5 bg-white text-corporate rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-100 transition-all shadow-2xl flex items-center gap-4 group/btn">
                        Panel de Administración
                        <i className="fa-solid fa-arrow-right-long group-hover/btn:translate-x-2 transition-transform"></i>
                    </Link>
                </div>
            )}
        </div>
    );
};

const TimeTracker = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [status, setStatus] = useState('out');
    const [todayLogs, setTodayLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        fetchStatus();
        return () => clearInterval(timer);
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await axios.get('/api/v1/time-logs/status');
            setStatus(res.data.status);
            setTodayLogs(res.data.today_logs || []);
        } catch (error) {
            console.error("Error al obtener estado de fichaje", error);
        } finally {
            setLoading(false);
        }
    };

    const handleClockAction = async () => {
        setActionLoading(true);
        try {
            const endpoint = status === 'out' ? '/api/v1/time-logs/check-in' : '/api/v1/time-logs/check-out';
            await axios.post(endpoint);
            await fetchStatus();
        } catch (error) {
            alert(error.response?.data?.message || "Ocurrió un error.");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return null;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden relative"
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-corporate/5 rounded-full translate-x-1/2 -translate-y-1/2"></div>
            <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                <div className="flex-shrink-0 text-center md:text-left">
                    <div className="text-6xl font-black text-slate-800 dark:text-slate-100 tracking-tighter font-mono mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                        {currentTime.toLocaleTimeString('es-ES', { hour12: false })}
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {currentTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
                <div className="flex-1 w-full max-w-sm">
                    <button
                        onClick={handleClockAction}
                        disabled={actionLoading}
                        className={`w-full p-6 rounded-[2rem] transition-all active:scale-95 flex flex-col items-center justify-center gap-2 border-2 ${
                            status === 'out' ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20' : 'bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/20'
                        }`}
                    >
                        <i className={`fa-solid ${actionLoading ? 'fa-circle-notch fa-spin' : (status === 'out' ? 'fa-sign-in-alt' : 'fa-sign-out-alt')} text-2xl`}></i>
                        <span className="text-xl font-black tracking-tight">{status === 'out' ? 'Fichar Entrada' : 'Fichar Salida'}</span>
                    </button>
                </div>
                <div className="flex-1 w-full flex flex-col gap-3">
                    <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Hoy</h5>
                    <div className="space-y-2 max-h-[100px] overflow-y-auto pr-2 custom-scrollbar">
                        {todayLogs.length > 0 ? todayLogs.map((log, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 text-[10px] font-bold">
                                <span className="text-slate-700 dark:text-slate-200">
                                    {new Date(log.check_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <i className="fa-solid fa-arrow-right text-[10px] text-slate-300 dark:text-slate-600"></i>
                                <span className={log.check_out_at ? "text-slate-700 dark:text-white" : "text-emerald-500 animate-pulse font-black"}>
                                    {log.check_out_at ? new Date(log.check_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TRABAJANDO...'}
                                </span>
                            </div>
                        )) : (
                            <p className="text-[10px] text-slate-400 font-bold text-center py-4 uppercase tracking-widest">Sin registros todavía</p>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default Dashboard;