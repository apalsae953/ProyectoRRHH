import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ModalPortal from '../components/ModalPortal';
import { motion, AnimatePresence } from 'framer-motion';

const TeamCalendar = () => {
    const { user } = useAuth();
    const isHrOrAdmin = user?.roles?.some(r => r && (
        r === 'admin' || r === 'hr_director' || (r.name && (r.name === 'admin' || r.name === 'hr_director'))
    ));

    const [viewDate, setViewDate] = useState(new Date());
    const [vacations, setVacations] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);

    const [newHoliday, setNewHoliday] = useState({ date: '', date_end: '', description: '', scope: 'national' });
    const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [vacRes, holRes] = await Promise.all([
                axios.get('/api/v1/vacations'),
                axios.get('/api/v1/holidays')
            ]);
            setVacations(vacRes.data?.data || []);
            setHolidays(holRes.data?.data || []);
        } catch (error) {
            console.error("Error cargando calendario", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateHoliday = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await axios.post('/api/v1/holidays', newHoliday);
            setIsHolidayModalOpen(false);
            setNewHoliday({ date: '', description: '', scope: 'national' });
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || "Error al crear festivo");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteHoliday = async (id) => {
        if (!confirm('¿Seguro que quieres eliminar este festivo?')) return;
        try {
            await axios.delete(`/api/v1/holidays/${id}`);
            fetchData();
        } catch (error) {
            alert("Error al eliminar festivo");
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = (firstDayOfMonth(year, month) + 6) % 7; // Ajustar a Lunes inicio

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const getHolidaysOnDay = (day) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return holidays.filter(h => h.date === dateStr);
    };

    const getVacationsOnDay = (day) => {
        const date = new Date(year, month, day);
        date.setHours(0, 0, 0, 0);
        return vacations.filter(v => {
            if (v.estado !== 'approved') return false;
            const start = new Date(v.fecha_inicio);
            const end = new Date(v.fecha_fin);
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);
            return date >= start && date <= end;
        });
    };

    const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
    const prevMonth = () => setViewDate(new Date(year, month - 1, 1));

    const CalendarSkeleton = () => (
        <div className="animate-fade-in pb-2">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden">
                 <div className="p-4 md:p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                     <div className="space-y-2">
                        <div className="w-48 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                        <div className="w-64 h-4 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse hidden md:block"></div>
                     </div>
                     <div className="flex gap-4">
                         <div className="w-32 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse"></div>
                         <div className="w-32 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse"></div>
                     </div>
                 </div>
                 <div className="p-2 md:p-4">
                     <div className="grid grid-cols-7 gap-1">
                         {Array.from({ length: 7 }).map((_, i) => (
                            <div key={`head-${i}`} className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mx-auto mb-2 animate-pulse"></div>
                         ))}
                         {Array.from({ length: 35 }).map((_, i) => (
                             <div key={i} className="h-20 md:h-24 bg-slate-100 dark:bg-slate-700/50 rounded-2xl animate-pulse"></div>
                         ))}
                     </div>
                 </div>
            </div>
        </div>
    );

    if (loading) return <CalendarSkeleton />;

    return (
        <div className="animate-fade-in pb-2">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="p-4 md:p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Calendario de Equipo</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Visualiza festivos y vacaciones aprobadas de toda la empresa.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {isHrOrAdmin && (
                            <button
                                onClick={() => setIsHolidayModalOpen(true)}
                                className="px-5 py-3 bg-red-500 dark:bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 dark:hover:bg-red-700 transition-all shadow-lg shadow-red-100 dark:shadow-none flex items-center gap-2"
                            >
                                <i className="fa-solid fa-calendar-plus"></i>
                                Añadir Festivo
                            </button>
                        )}
                        <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <button onClick={prevMonth} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-600">
                                <i className="fa-solid fa-chevron-left"></i>
                            </button>
                            <span className="font-black text-slate-700 dark:text-slate-200 w-32 text-center uppercase tracking-widest text-sm">
                                {monthNames[month]} {year}
                            </span>
                            <button onClick={nextMonth} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-600">
                                <i className="fa-solid fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-2 md:p-4">
                    <div className="grid grid-cols-7 gap-1">
                        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                            <div key={d} className="text-center text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-tighter pb-2">{d}</div>
                        ))}

                        {Array.from({ length: startDay }).map((_, i) => (
                            <div key={`empty-${i}`} className="h-20 md:h-24 bg-slate-50/30 dark:bg-slate-800/30 rounded-2xl border border-transparent"></div>
                        ))}

                        {Array.from({ length: totalDays }).map((_, i) => {
                            const day = i + 1;
                            const dayHolidays = getHolidaysOnDay(day);
                            const dayVacations = getVacationsOnDay(day);
                            const isWeekend = (startDay + i) % 7 >= 5;

                            return (
                                <div key={day} className={`h-20 md:h-24 rounded-2xl border transition-all p-1.5 flex flex-col gap-1 overflow-hidden ${isWeekend ? 'bg-slate-50/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-corporate/30 dark:hover:border-corporate/50 hover:shadow-md'}`}>
                                    <span className={`text-xs font-bold ${isWeekend ? 'text-slate-400 dark:text-slate-600' : 'text-slate-700 dark:text-slate-300'}`}>{day}</span>

                                    {dayHolidays.map(h => (
                                        <div key={h.id} className="text-[9px] bg-red-100 text-red-700 p-1.5 rounded-lg font-bold truncate flex justify-between items-center group/holiday" title={h.description}>
                                            <span className="truncate flex-1">
                                                <i className="fa-solid fa-star mr-1 opacity-40"></i>
                                                {h.description}
                                            </span>
                                            {isHrOrAdmin && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteHoliday(h.id); }}
                                                    className="opacity-0 group-hover/holiday:opacity-100 hover:text-red-900 transition-opacity ml-1"
                                                >
                                                    <i className="fa-solid fa-xmark text-[10px]"></i>
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    {dayVacations.map(v => (
                                        <div 
                                            key={v.id} 
                                            className={`text-[8px] p-1 rounded-md font-medium truncate leading-none flex items-center gap-0.5 ${v.tipo === 'sick_leave' ? 'bg-red-500 text-white' : v.tipo === 'overtime' ? 'bg-amber-500 text-white' : 'bg-corporate text-white'}`}
                                            title={`${v.empleado?.nombre || 'Alguien'} (${v.tipo === 'sick_leave' ? 'Baja Médica' : v.tipo === 'overtime' ? 'Horas Extra' : 'Vacaciones'})`}
                                        >
                                            <i className={`fa-solid ${v.tipo === 'sick_leave' ? 'fa-hospital-user' : v.tipo === 'overtime' ? 'fa-clock' : 'fa-umbrella-beach'} scale-75`}></i>
                                            {v.empleado?.nombre || 'Alguien'}
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Modal de Nuevo Festivo */}
            <AnimatePresence>
                {isHolidayModalOpen && (
                    <ModalPortal>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700"
                            >
                                <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Configurar Festivo</h3>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Añade uno o varios días al calendario</p>
                                    </div>
                            <button onClick={() => setIsHolidayModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <div className="p-8">
                            <form onSubmit={handleCreateHoliday} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Desde el día</label>
                                        <input
                                            type="date" required
                                            value={newHoliday.date}
                                            onChange={e => setNewHoliday({ ...newHoliday, date: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-red-500/5 focus:border-red-500/40 outline-none transition-all font-bold text-slate-700 dark:text-slate-200 color-scheme-dark"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Hasta el día (Opcional)</label>
                                        <input
                                            type="date"
                                            value={newHoliday.date_end}
                                            onChange={e => setNewHoliday({ ...newHoliday, date_end: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-red-500/5 focus:border-red-500/40 outline-none transition-all font-bold text-slate-700 dark:text-slate-200 color-scheme-dark"
                                            placeholder="Para periodos largos..."
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Descripción / Nombre del festivo</label>
                                    <input
                                        type="text" required
                                        placeholder="Ej: Puente de la Constitución, Feria..."
                                        value={newHoliday.description}
                                        onChange={e => setNewHoliday({ ...newHoliday, description: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-red-500/5 focus:border-red-500/40 outline-none transition-all font-bold text-slate-700 dark:text-slate-200 placeholder:font-medium placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                    />
                                </div>
                                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900/50 flex gap-3">
                                    <i className="fa-solid fa-circle-info text-amber-500 mt-0.5"></i>
                                    <p className="text-[10px] text-amber-700 dark:text-amber-500 font-bold leading-relaxed">
                                        Si seleccionas un rango, se crearán registros individuales para cada día. Estos días NO se contarán en las solicitudes de vacaciones de los empleados.
                                    </p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-100 hover:bg-red-600 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Procesando...' : 'Confirmar Festivos'}
                                </button>
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

export default TeamCalendar;
