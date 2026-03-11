import { useState, useEffect } from 'react';
import holidayService from '../services/holidayService';
import { useAuth } from '../context/AuthContext';

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
        <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-corporate"></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-20">
            {/* Header Section */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-corporate opacity-[0.02] rounded-full translate-x-1/2 -translate-y-1/2"></div>
                <div className="relative z-10">
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <i className="fa-solid fa-calendar-day text-corporate"></i>
                        Calendario de Festivos
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">Configura los días no laborables del año.</p>
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
            <div className="bg-amber-50 border border-amber-100 rounded-[1.5rem] p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <i className="fa-solid fa-circle-info text-xl"></i>
                </div>
                <div>
                    <h4 className="font-black text-amber-900 text-sm uppercase tracking-wide">Información Automática</h4>
                    <p className="text-amber-700/80 text-sm font-medium mt-1 leading-relaxed">
                        El sistema ya excluye automáticamente los <strong>fines de semana</strong> (Sábados y Domingos) de las solicitudes de vacaciones. Solo necesitas registrar aquí los festivos nacionales, regionales o locales.
                    </p>
                </div>
            </div>

            {/* Grid de Festivos */}
            {error && <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 mb-4">{error}</div>}
            {success && <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 mb-4">{success}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {holidays.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
                        <i className="fa-regular fa-calendar-xmark text-5xl text-slate-200 mb-4 block"></i>
                        <p className="text-slate-400 font-bold">No hay festivos registrados todavía.</p>
                    </div>
                ) : (
                    holidays.map(h => (
                        <div key={h.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:border-corporate/20 transition-all duration-500 group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-corporate/10 group-hover:text-corporate transition-colors">
                                    <i className="fa-solid fa-star text-slate-300 group-hover:text-corporate"></i>
                                </div>
                                {isHrOrAdmin && (
                                    <button
                                        onClick={() => handleDelete(h.id)}
                                        className="w-8 h-8 rounded-full bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center text-xs"
                                    >
                                        <i className="fa-solid fa-trash-can"></i>
                                    </button>
                                )}
                            </div>
                            <h4 className="text-lg font-black text-slate-800 mb-1">{h.description || h.name}</h4>
                            <div className="flex items-center gap-2 text-corporate font-black text-xs uppercase tracking-widest">
                                <i className="fa-regular fa-calendar text-sm"></i>
                                {new Date(h.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal de Creación */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col animate-scale-up">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">Nuevo Festivo</h3>
                            <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-200 text-slate-500 hover:bg-slate-300 transition-colors">
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <div className="p-8">
                            <form onSubmit={handleCreate} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Desde el día</label>
                                        <input
                                            type="date"
                                            required
                                            value={newHoliday.date}
                                            onChange={e => setNewHoliday({ ...newHoliday, date: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-corporate/5 focus:border-corporate/40 outline-none transition-all font-bold text-slate-700"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Hasta el día</label>
                                        <input
                                            type="date"
                                            value={newHoliday.date_end}
                                            onChange={e => setNewHoliday({ ...newHoliday, date_end: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-corporate/5 focus:border-corporate/40 outline-none transition-all font-bold text-slate-700"
                                            placeholder="Opcional"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nombre / Identificación</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej: Año Nuevo, Semana Santa..."
                                        value={newHoliday.description}
                                        onChange={e => setNewHoliday({ ...newHoliday, description: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-corporate/5 focus:border-corporate/40 outline-none transition-all font-bold text-slate-700 placeholder:font-medium placeholder:text-slate-300"
                                    />
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-slate-100 text-slate-400 hover:bg-slate-200 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-[2] py-4 bg-corporate text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-corporate/20 hover:bg-corporate-dark transition-all disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Guardando...' : 'Confirmar Registro'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Holidays;
