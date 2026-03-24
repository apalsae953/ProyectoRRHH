import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { motion } from 'framer-motion';

const TimeLogs = () => {
    const [logs, setLogs] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [exportLoading, setExportLoading] = useState(false);

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`/api/v1/time-logs?date=${date}&page=${page}`);
                setLogs(res.data.data || []);
                setPagination({
                    current: res.data.current_page,
                    last: res.data.last_page,
                    total: res.data.total
                });
            } catch (error) {
                console.error("Error al cargar los fichajes:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [date, page]);

    const formatTime = (timeStr) => {
        if (!timeStr) return '--:--:--';
        return new Date(timeStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    };

    const calculateDuration = (start, end) => {
        if (!start || !end) return '-';
        const s = new Date(start);
        const e = new Date(end);
        const diff = Math.floor((e - s) / 1000);
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        return `${hours}h ${minutes}min`;
    };

    const handleDateChange = (newDate) => {
        setDate(newDate);
        setPage(1);
    };

    const handleExport = async () => {
        setExportLoading(true);
        try {
            const response = await axios.get(`/api/v1/time-logs/export?date=${date}`, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Fichajes_${date}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Error al exportar:", error);
            alert("No se pudo descargar el archivo. Asegúrate de tener permisos suficientes.");
        } finally {
            setExportLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in p-2 md:p-6 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Control Horario</h2>
                    <p className="text-slate-500 font-medium">Supervisión global de entradas y salidas de la plantilla.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Día:</span>
                        <input 
                            type="date"
                            value={date}
                            onChange={(e) => handleDateChange(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-slate-700 dark:text-white font-bold text-sm outline-none cursor-pointer"
                        />
                    </div>
                    
                    <button 
                        onClick={handleExport}
                        disabled={exportLoading}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
                    >
                        {exportLoading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-file-export"></i>}
                        Exportar Excel
                    </button>
                </div>
            </header>

            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Empleado</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Entrada</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Salida</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Duración</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Dirección IP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                            {!loading && logs.length > 0 ? logs.map((log) => (
                                <motion.tr 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    key={log.id} 
                                    className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                                >
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-corporate/10 text-corporate flex items-center justify-center font-black">
                                                {log.user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-800 dark:text-white leading-none">{log.user.name} {log.user.surname}</p>
                                                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Usuario #{log.user.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6 text-center font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
                                        {formatTime(log.check_in_at)}
                                    </td>
                                    <td className="p-6 text-center font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
                                        {formatTime(log.check_out_at)}
                                    </td>
                                    <td className="p-6 text-center font-black text-sm text-indigo-600 dark:text-indigo-400">
                                        {calculateDuration(log.check_in_at, log.check_out_at)}
                                    </td>
                                    <td className="p-6 text-center">
                                        {!log.check_out_at ? (
                                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
                                                <i className="fa-solid fa-circle text-[6px]"></i>
                                                Activo
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                Completado
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-6 text-right font-bold text-[10px] text-slate-400 tracking-tighter">
                                        {log.ip_address || 'Sin IP'}
                                    </td>
                                </motion.tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="p-20 text-center">
                                        {loading ? (
                                            <div className="flex justify-center">
                                                <div className="w-10 h-10 border-4 border-corporate border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-4 text-slate-400">
                                                <i className="fa-solid fa-clock-rotate-left text-4xl opacity-20"></i>
                                                <p className="font-bold">No hay registros de fichaje para esta fecha.</p>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {pagination && pagination.last > 1 && (
                    <div className="p-6 border-t border-slate-50 dark:border-slate-700/50 flex items-center justify-between bg-white dark:bg-slate-800">
                        <p className="text-xs font-bold text-slate-400">
                            Mostrando <span className="text-slate-800 dark:text-white font-black">{logs.length}</span> registros de un total de <span className="text-slate-800 dark:text-white font-black">{pagination.total}</span>
                        </p>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-corporate hover:text-white disabled:opacity-30 transition-all font-bold"
                            >
                                <i className="fa-solid fa-arrow-left mr-2"></i>
                                Anterior
                            </button>
                            <span className="px-4 py-2 font-black text-slate-800 dark:text-white text-xs">
                                {page} / {pagination.last}
                            </span>
                            <button 
                                onClick={() => setPage(p => Math.min(pagination.last, p + 1))}
                                disabled={page === pagination.last}
                                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-corporate hover:text-white disabled:opacity-30 transition-all font-bold"
                            >
                                Siguiente
                                <i className="fa-solid fa-arrow-right ml-2"></i>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TimeLogs;
