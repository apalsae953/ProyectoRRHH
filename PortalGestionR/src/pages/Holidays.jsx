import { useState, useEffect } from 'react';
import holidayService from '../services/holidayService';
import { useAuth } from '../context/AuthContext';
import ModalPortal from '../components/ModalPortal';
import { motion, AnimatePresence } from 'framer-motion';

const Holidays = () => {
    const { user } = useAuth();
    const isHrOrAdmin = user?.roles?.some(r => r && (r === 'admin' || r === 'hr_director' || r.name === 'admin' || r.name === 'hr_director'));

    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newHoliday, setNewHoliday] = useState({ date: '', date_end: '', description: '', scope: 'national' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchHolidays = async () => {
        try {
            const response = await holidayService.getHolidays();
            setHolidays(response.data?.data || []);
        } catch (error) {
            console.error("Error al cargar festivos", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHolidays();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        setIsSubmitting(true);
        try {
            await holidayService.createHoliday(newHoliday);
            setSuccess('Festivo añadido correctamente.');
            setNewHoliday({ date: '', date_end: '', description: '', scope: 'national' });
            setIsModalOpen(false);
            fetchHolidays();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al añadir el festivo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Eliminar este día festivo?")) return;
        try {
            await holidayService.deleteHoliday(id);
            fetchHolidays();
        } catch (error) {
            alert("Error al eliminar");
        }
    };

    if (loading) return (
        <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-20">
            {/* Header Skeleton */}
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-slate-700 h-32 flex items-center mb-6">
                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse mr-4"></div>
                <div className="space-y-2">
                    <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                    <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                </div>
            </div>
            {/* Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 h-32 animate-pulse"></div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20 transition-colors">
            {/* Header Section */}
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden transition-colors">
                <div className="absolute top-0 right-0 w-64 h-64 bg-corporate opacity-[0.02] dark:opacity-5 rounded-full translate-x-1/2 -translate-y-1/2 transition-opacity"></div>
                <div className="relative z-10">
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3 transition-colors">
                        <i className="fa-solid fa-calendar-day text-corporate"></i>
                        Calendario de Festivos
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1 transition-colors">Configura los días no laborables del año.</p>
                </div>
                {isHrOrAdmin && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="relative z-10 bg-slate-900 hover:bg-corporate text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 hover:shadow-corporate/20 transition-all duration-300 flex items-center gap-2 group"
                    >
                        <i className="fa-solid fa-plus transition-transform group-hover:rotate-90"></i>
                        Añadir Festivo
                    </button>
                )}
            </div>

            {/* Info Box */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 rounded-[1.5rem] p-6 flex items-start gap-4 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-500 flex items-center justify-center shrink-0 transition-colors">
                    <i className="fa-solid fa-circle-info text-xl"></i>
                </div>
                <div>
                    <h4 className="font-black text-amber-900 dark:text-amber-500 text-sm uppercase tracking-wide transition-colors">Información Automática</h4>
                    <p className="text-amber-700/80 dark:text-amber-400/80 text-sm font-medium mt-1 leading-relaxed transition-colors">
                        El sistema ya excluye automáticamente los <strong>fines de semana</strong> (Sábados y Domingos) de las solicitudes de vacaciones. Solo necesitas registrar aquí los festivos nacionales, regionales o locales.
                    </p>
                </div>
            </div>

            {/* Grid de Festivos */}
            {error && <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-900/50 mb-4 transition-colors">{error}</div>}
            {success && <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 mb-4 transition-colors">{success}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {holidays.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white dark:bg-slate-800 rounded-[2rem] border-2 border-dashed border-slate-100 dark:border-slate-700 transition-colors">
                        <i className="fa-regular fa-calendar-xmark text-5xl text-slate-200 dark:text-slate-600 mb-4 block"></i>
                        <p className="text-slate-400 dark:text-slate-500 font-bold transition-colors">No hay festivos registrados todavía.</p>
                    </div>
                ) : (
                    holidays.map(h => (
                        <div key={h.id} className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:border-corporate/20 dark:hover:border-corporate/40 transition-all duration-500 group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl group-hover:bg-corporate/10 dark:group-hover:bg-corporate/20 group-hover:text-corporate transition-colors">
                                    <i className="fa-solid fa-star text-slate-300 dark:text-slate-600 group-hover:text-corporate transition-colors"></i>
                                </div>
                                {isHrOrAdmin && (
                                    <button
                                        onClick={() => handleDelete(h.id)}
                                        className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/30 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center text-xs"
                                    >
                                        <i className="fa-solid fa-trash-can"></i>
                                    </button>
                                )}
                            </div>
                            <h4 className="text-lg font-black text-slate-800 dark:text-white mb-1 transition-colors">{h.description || h.name}</h4>
                            <div className="flex items-center gap-2 text-corporate dark:text-corporate-light font-black text-xs uppercase tracking-widest transition-colors">
                                <i className="fa-regular fa-calendar text-sm"></i>
                                {new Date(h.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal de Creación */}
            <AnimatePresence>
            {isModalOpen && (
                <ModalPortal>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-colors"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20 dark:border-slate-700 flex flex-col transition-colors"
                        >
                            <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 transition-colors">
                                <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight transition-colors">Nuevo Festivo</h3>
                                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            </div>
                            <div className="p-8">
                                <form onSubmit={handleCreate} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1 transition-colors">Desde el día</label>
                                            <input
                                                type="date"
                                                required
                                                value={newHoliday.date}
                                                onChange={e => setNewHoliday({ ...newHoliday, date: e.target.value })}
                                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-corporate/5 dark:focus:ring-corporate/10 focus:border-corporate/40 outline-none transition-all font-bold text-slate-700 dark:text-white color-scheme-light dark:color-scheme-dark"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1 transition-colors">Hasta el día</label>
                                            <input
                                                type="date"
                                                value={newHoliday.date_end}
                                                onChange={e => setNewHoliday({ ...newHoliday, date_end: e.target.value })}
                                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-corporate/5 dark:focus:ring-corporate/10 focus:border-corporate/40 outline-none transition-all font-bold text-slate-700 dark:text-white color-scheme-light dark:color-scheme-dark"
                                                placeholder="Opcional"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1 transition-colors">Nombre / Identificación</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Ej: Año Nuevo, Semana Santa..."
                                            value={newHoliday.description}
                                            onChange={e => setNewHoliday({ ...newHoliday, description: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-corporate/5 dark:focus:ring-corporate/10 focus:border-corporate/40 outline-none transition-all font-bold text-slate-700 dark:text-white placeholder:font-medium placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                        />
                                    </div>
                                    <div className="pt-4 flex gap-3 border-t border-slate-100 dark:border-slate-700 mt-6 transition-colors">
                                        <button
                                            type="button"
                                            onClick={() => setIsModalOpen(false)}
                                            className="flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="flex-[2] py-4 bg-corporate hover:bg-corporate-dark text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-corporate/20 disabled:opacity-50 transition-all"
                                        >
                                            {isSubmitting ? 'Guardando...' : 'Confirmar Registro'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                </ModalPortal>
            )}
            </AnimatePresence>
        </div>
    );
};

export default Holidays;
