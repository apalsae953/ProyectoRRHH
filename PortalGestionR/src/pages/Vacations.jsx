import { useState, useEffect } from 'react';
import axios from '../api/axios';
import vacationService from '../services/vacationService';
import ModalPortal from '../components/ModalPortal';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '../context/AuthContext';

const Vacations = () => {
    const { user } = useAuth();
    const isHrOrAdmin = user?.roles?.some(r => r && (r === 'admin' || r === 'hr_director' || r.name === 'admin' || r.name === 'hr_director'));

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const [vacations, setVacations] = useState([]);
    const [balance, setBalance] = useState(null);
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [requestMode, setRequestMode] = useState('days'); // 'days' or 'hours'
    const [newVacation, setNewVacation] = useState({ 
        start_date: '', 
        end_date: '', 
        note: '', 
        type: 'vacation',
        hours: '' 
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [globalSettings, setGlobalSettings] = useState(null);

    // Paginación y Ordenamiento
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortKey, setSortKey] = useState('fecha_inicio');
    const [sortDirection, setSortDirection] = useState('desc');
    const itemsPerPage = 10;

    const fetchData = async () => {
        setLoading(true);
        try {
            const [vacationsRes, balanceRes, holidayRes, settingsRes] = await Promise.all([
                vacationService.getMyVacations(),
                vacationService.getMyBalance().catch(() => null),
                axios.get('/api/v1/holidays'),
                axios.get('/api/v1/settings').catch(() => ({ data: {} }))
            ]);
            
            const settingsData = settingsRes.data || {};
            setGlobalSettings(settingsData);

            setVacations(vacationsRes.data?.data || vacationsRes.data || []);
            setHolidays(holidayRes.data?.data || []);
            const balanceData = balanceRes?.data?.data || balanceRes?.data || {
                dias_generados_hasta_hoy: 0,
                dias_disfrutados: 0,
                dias_totales_disponibles: 0,
                dias_base_anuales: parseInt(settingsData.vacation_days_per_year) || 22
            };
            setBalance(balanceData);
        } catch (error) {
            console.error("Error al cargar el módulo de vacaciones", error);
        } finally {
            setLoading(false);
        }
    };

    // Lógica de Ordenamiento
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortKey === key && sortDirection === 'asc') direction = 'desc';
        setSortKey(key);
        setSortDirection(direction);
        setCurrentPage(1); //Redsetear a la priemera pagina
    };

    const filteredVacations = vacations.filter(v => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
            (v.estado && v.estado.toLowerCase().includes(searchLower)) ||
            (v.fecha_inicio && v.fecha_inicio.includes(searchLower)) ||
            (v.fecha_fin && v.fecha_fin.includes(searchLower)) ||
            (v.nota && v.nota.toLowerCase().includes(searchLower))
        );
    });

    const sortedVacations = [...filteredVacations].sort((a, b) => {
        const aValue = a[sortKey];
        const bValue = b[sortKey];

        // Ordenar por fechas
        if (sortKey.includes('fecha')) {
            const dateA = new Date(aValue);
            const dateB = new Date(bValue);
            if (dateA < dateB) return sortDirection === 'asc' ? -1 : 1;
            if (dateA > dateB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        }

        // Ordenar por estado
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    // Lógica de Paginación
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedVacations.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredVacations.length / itemsPerPage);

    const changePage = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRequestVacation = async (e, forcedStatus = 'pending') => {
        if (e) e.preventDefault();
        setIsSubmitting(true);
        setFormError('');

        const formData = new FormData();
        
        // Si estamos en modo horas, la fecha de inicio y fin son la misma
        if (requestMode === 'hours') {
            formData.append('start_date', newVacation.start_date);
            formData.append('end_date', newVacation.start_date); // Misma fecha
            formData.append('hours', newVacation.hours);
        } else {
            formData.append('start_date', newVacation.start_date);
            formData.append('end_date', newVacation.end_date);
        }
        
        formData.append('note', newVacation.note);
        formData.append('type', newVacation.type || 'vacation');
        formData.append('status', forcedStatus);
        
        if (selectedFile) {
            formData.append('attachment', selectedFile);
        }

        try {
            await axios.post('/api/v1/vacations', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setIsAddModalOpen(false);
            setNewVacation({ start_date: '', end_date: '', note: '', type: 'vacation', hours: '' });
            setSelectedFile(null);
            setRequestMode('days');
            await fetchData();
            
            // Dispatch event para actualizar la campana del layout si es necesario
            window.dispatchEvent(new CustomEvent('refresh-notifications'));
            window.dispatchEvent(new CustomEvent('show-toast', { 
                detail: { 
                    message: 'Solicitud enviada correctamente', 
                    type: 'success' 
                } 
            }));
        } catch (error) {
            setFormError(error.response?.data?.message || 'Error al procesar la solicitud');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Eliminamos handleRequestOvertime ya que se integra en el anterior

    const handleCancelVacation = async (id) => {
        const reason = window.prompt('Por favor, indica el motivo de la cancelación:');
        if (!reason) {
            alert('Debes indicar un motivo');
            return;
        }

        try {
            await vacationService.cancelVacation(id, reason);
            await fetchData();
            window.dispatchEvent(new CustomEvent('refresh-notifications'));
            window.dispatchEvent(new CustomEvent('show-toast', { 
                detail: { 
                    message: 'Solicitud cancelada correctamente', 
                    type: 'success' 
                } 
            }));
        } catch (error) {
            alert(error.response?.data?.message || 'Error al cancelar la solicitud');
        }
    };

    const handleHideVacation = async (id) => {
        if (!window.confirm('¿Quieres eliminar esta solicitud de tu historial?')) return;
        try {
            await vacationService.deleteVacation(id);
            await fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error al eliminar la solicitud');
        }
    };

    // Función para renderizar el color de la "píldora" según el estado
    const renderStatus = (status) => {
        const styles = {
            draft: 'bg-slate-100 text-slate-600 border-slate-200',
            pending: 'bg-amber-50 text-amber-700 border-amber-200',
            approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            rejected: 'bg-red-50 text-red-700 border-red-200',
            canceled: 'bg-slate-50 text-slate-700 border-slate-200',
        };
        const icons = {
            draft: 'fa-regular fa-file-lines',
            pending: 'fa-regular fa-clock',
            approved: 'fa-solid fa-check',
            rejected: 'fa-solid fa-xmark',
            canceled: 'fa-solid fa-ban',
        };
        const labels = {
            draft: 'Borrador',
            pending: 'Pendiente',
            approved: 'Aprobado',
            rejected: 'Rechazado',
            canceled: 'Cancelado',
        };
        return (
            <div className={'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border ' + (styles[status] || styles.pending)}>
                <i className={icons[status] || icons.pending}></i>
                {labels[status] || status}
            </div>
        );
    };

    if (loading) return (
        <div className="space-y-8 animate-fade-in pb-10 w-full">
            {/* Header Skeleton */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-700 p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-3">
                    <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                    <div className="h-4 w-72 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                </div>
                <div className="flex gap-3">
                    <div className="h-11 w-36 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse"></div>
                    <div className="h-11 w-40 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse"></div>
                </div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-5">
                        <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse shrink-0"></div>
                        <div className="space-y-2 w-full">
                            <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                            <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table Skeleton */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-md border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                    <div className="h-10 w-64 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse"></div>
                </div>
                <div className="p-6">
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-14 w-full bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 animate-pulse"></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in pb-10">

            {/* Cabecera y Botón de Nueva Solicitud */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden mb-6 transition-colors">
                <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-corporate text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-corporate/20">
                            <i className="fa-solid fa-umbrella-beach"></i>
                        </div>
                        <div>
                            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight transition-colors">Mis Vacaciones</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5 font-medium transition-colors">Gestiona tus días libres y horas extra.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsAddModalOpen(true)} className="bg-corporate hover:bg-corporate-dark text-white font-black py-3 px-8 rounded-2xl transition-all shadow-xl shadow-corporate/20 hover:shadow-corporate/30 flex items-center gap-3 group active:scale-95">
                            <i className="fa-solid fa-plus transition-transform group-hover:rotate-90"></i>
                            <span className="uppercase text-xs tracking-widest">Nueva Solicitud</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Alerta Informativa sobre Cálculo del Word */}
            <div className="mb-8 bg-corporate/5 dark:bg-corporate/10 border border-corporate/10 dark:border-corporate/20 p-5 rounded-3xl flex items-start gap-4 transition-colors">
                <div className="w-10 h-10 bg-corporate text-white rounded-xl flex items-center justify-center shrink-0 shadow-md">
                    <i className="fa-solid fa-circle-info text-xl"></i>
                </div>
                <div>
                    <h4 className="font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2 transition-colors">
                        ¿Cómo se calculan tus días?
                        <span className="text-[10px] bg-corporate/10 dark:bg-corporate/20 text-corporate dark:text-corporate-light px-2 py-0.5 rounded-full uppercase tracking-tighter">Regla Impuesta</span>
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed transition-colors">
                        Tus vacaciones se generan día a día. Los <strong>Días Generados</strong> muestran lo que has devengado proporcionalmente hasta hoy (aprox. 1.83 días por mes).
                        Puedes solicitar días que aún no has generado, pero RRHH tendrá en cuenta tu saldo anual base ({balance?.dias_base_anuales || 22} días) para la aprobación.
                    </p>
                </div>
            </div>

            {/* Cabecera con estadísticas rápidas o balances */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 group/stats">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-5 hover:shadow-md hover:border-corporate/30 dark:hover:border-corporate/50 transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-corporate/5 dark:bg-corporate/10 rotate-45 translate-x-12 -translate-y-8 blur-2xl group-hover:bg-corporate/10 dark:group-hover:bg-corporate/20 transition-colors"></div>
                    <div className="w-12 h-12 bg-corporate/10 dark:bg-corporate/20 text-corporate rounded-2xl flex items-center justify-center text-xl shadow-inner border border-corporate/20 dark:border-corporate/30 shrink-0 z-10 transition-colors">
                        <i className="fa-regular fa-calendar"></i>
                    </div>
                    <div className="z-10">
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 transition-colors">Generados (Hasta hoy)</p>
                        <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tight transition-colors">{balance?.dias_generados_hasta_hoy || 0} <span className="text-sm font-bold text-slate-400 dark:text-slate-500">días</span></p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1 transition-colors">Base anual: {balance?.dias_base_anuales || 22} días</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-5 hover:shadow-md hover:border-amber-400/30 dark:hover:border-amber-400/50 transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 dark:bg-amber-400/10 rotate-45 translate-x-12 -translate-y-8 blur-2xl group-hover:bg-amber-400/10 dark:group-hover:bg-amber-400/20 transition-colors"></div>
                    <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 rounded-2xl flex items-center justify-center text-xl shadow-inner border border-amber-200/50 shrink-0 z-10 transition-colors">
                        <i className="fa-solid fa-plane-departure"></i>
                    </div>
                    <div className="z-10">
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 transition-colors">Días Consumidos</p>
                        <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tight transition-colors">{balance?.dias_disfrutados || 0} <span className="text-sm font-bold text-slate-400 dark:text-slate-500">días</span></p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-5 hover:shadow-md hover:border-emerald-500/30 dark:hover:border-emerald-500/50 transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-500/10 rotate-45 translate-x-12 -translate-y-8 blur-2xl group-hover:bg-emerald-500/10 dark:group-hover:bg-emerald-500/20 transition-colors"></div>
                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center text-xl shadow-inner border border-emerald-200/50 shrink-0 z-10 transition-colors">
                        <i className="fa-solid fa-umbrella-beach"></i>
                    </div>
                    <div className="z-10">
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 transition-colors">Días Disponibles</p>
                        <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight transition-colors">{balance?.dias_totales_disponibles || 22} <span className="text-sm font-bold opacity-70">días</span></p>
                    </div>
                </div>

                {/* Próximos Festivos */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col gap-4 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Próximos Festivos</h4>
                        <i className="fa-solid fa-calendar-day text-corporate dark:text-corporate-light"></i>
                    </div>
                    <div className="space-y-3">
                        {holidays.filter(h => new Date(h.date) >= new Date()).slice(0, 3).map(h => (
                            <div key={h.id} className="flex items-center gap-3">
                                <div className="text-[10px] font-bold bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-600 min-w-[70px] text-center shrink-0 transition-colors">
                                    {new Date(h.date).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
                                </div>
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate transition-colors">{h.description}</span>
                            </div>
                        ))}
                        {holidays.length === 0 && <p className="text-[10px] text-slate-400 dark:text-slate-500 italic transition-colors">No hay festivos próximos</p>}
                    </div>
                </div>
            </div>

            {/* Tabla de Historial */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors" >
                {/* Barra de Búsqueda y Filtros */}
                <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-5 items-center justify-between bg-white dark:bg-slate-800 transition-colors">
                    <div className="relative w-full md:w-96 group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <i className="fa-solid fa-magnifying-glass text-slate-300 dark:text-slate-500 group-focus-within:text-corporate transition-colors"></i>
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar en el historial..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-corporate/10 focus:border-corporate/40 transition-all text-sm font-medium text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="px-4 py-2 bg-corporate/5 dark:bg-corporate/10 text-corporate dark:text-corporate-light rounded-full text-[10px] font-black uppercase tracking-widest border border-corporate/10 dark:border-corporate/20 transition-colors">
                            {filteredVacations.length} Solicitudes
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 transition-colors">
                                <th className="p-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-700 cursor-pointer hover:text-corporate transition-colors" onClick={() => handleSort('fecha_inicio')}>
                                    <div className="flex items-center gap-2">
                                        Periodo de Descanso
                                        {sortKey === 'fecha_inicio' && (sortDirection === 'asc' ? <i className="fa-solid fa-arrow-up-short-wide"></i> : <i className="fa-solid fa-arrow-down-short-wide"></i>)}
                                    </div>
                                </th>
                                <th className="p-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-700 text-center transition-colors">Duración</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-700 cursor-pointer hover:text-corporate transition-colors" onClick={() => handleSort('estado')}>
                                    Estado
                                </th>
                                <th className="p-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-700 text-right transition-colors">Gestión</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50 transition-colors">
                            {currentItems.length > 0 ? (
                                currentItems.map((vacation) => (
                                    <tr key={vacation.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-all duration-300">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-600 flex flex-col items-center justify-center shadow-sm group-hover:border-corporate/30 dark:group-hover:border-corporate/50 group-hover:shadow-md transition-all ${vacation.tipo === 'overtime' ? 'bg-amber-50/30 dark:bg-amber-900/10' : ''}`}>
                                                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">{new Date(vacation.fecha_inicio).toLocaleString('es', { month: 'short' })}</span>
                                                    <span className={`text-lg font-black leading-none ${vacation.tipo === 'overtime' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-white'}`}>{new Date(vacation.fecha_inicio).getDate()}</span>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        {vacation.tipo === 'overtime' ? (
                                                            <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Horas Extra</span>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                {vacation.tipo === 'sick_leave' && (
                                                                    <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest mr-1">Baja Médica</span>
                                                                )}
                                                                {vacation.tipo === 'other' && (
                                                                    <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest mr-1">Otros</span>
                                                                )}
                                                                <span className="font-bold text-slate-700 dark:text-slate-300">{new Date(vacation.fecha_inicio).toLocaleDateString()}</span>
                                                                <i className="fa-solid fa-arrow-right text-[10px] text-slate-300 dark:text-slate-500"></i>
                                                                <span className="font-bold text-slate-700 dark:text-slate-300">{new Date(vacation.fecha_fin).toLocaleDateString()}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {vacation.nota && (
                                                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium italic truncate max-w-[200px]">{vacation.nota}</p>
                                                    )}
                                                    {vacation.tipo === 'overtime' && (
                                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight">Realizadas el {new Date(vacation.fecha_inicio).toLocaleDateString()}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 text-center">
                                            <div className="inline-flex flex-col items-center">
                                                {vacation.horas && vacation.horas > 0 ? (
                                                    <>
                                                        <span className={`text-lg font-black ${vacation.tipo === 'overtime' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-white'}`}>{vacation.horas}</span>
                                                        <span className={`text-[9px] font-black uppercase tracking-tighter ${vacation.tipo === 'overtime' ? 'text-amber-400 dark:text-amber-500' : 'text-slate-400 dark:text-slate-500'}`}>Horas {vacation.tipo === 'overtime' ? 'Extra' : ''}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="text-lg font-black text-slate-800 dark:text-white">{vacation.dias_solicitados}</span>
                                                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Días Lab.</span>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col gap-1.5">
                                                {renderStatus(vacation.estado || 'pending')}
                                                {vacation.mensaje_admin && (
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 pl-1 transition-colors">
                                                        <i className="fa-solid fa-comment-dots text-corporate/40 dark:text-corporate/60"></i>
                                                        <span className="italic truncate max-w-[150px]">{vacation.mensaje_admin}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {vacation.adjunto && (
                                                    <a
                                                        href={vacation.adjunto}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="w-10 h-10 rounded-xl bg-corporate/5 dark:bg-corporate/10 text-corporate dark:text-corporate-light hover:bg-corporate hover:text-white transition-all duration-300 flex items-center justify-center shadow-sm border border-corporate/10 dark:border-corporate/20"
                                                        title="Ver Adjunto"
                                                    >
                                                        <i className="fa-solid fa-paperclip text-sm"></i>
                                                    </a>
                                                )}
                                                {/* El botón de cancelar solo sale si está pendiente/aprobada y NO ha pasado la fecha (o si eres admin) */}
                                                {(vacation.estado === 'pending' || vacation.estado === 'approved' || vacation.estado === 'draft') && 
                                                 (new Date(vacation.fecha_inicio) > new Date() || isHrOrAdmin) && (
                                                    <button
                                                        onClick={() => handleCancelVacation(vacation.id)}
                                                        className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 hover:bg-amber-500 hover:text-white transition-all duration-300 flex items-center justify-center shadow-sm border border-amber-100 dark:border-amber-800 hover:scale-110"
                                                        title="Cancelar Solicitud"
                                                    >
                                                        <i className="fa-solid fa-ban text-sm"></i>
                                                    </button>
                                                )}
                                                {(vacation.estado === 'canceled' || vacation.estado === 'rejected' || new Date(vacation.fecha_fin) < new Date()) && (
                                                    <button
                                                        onClick={() => handleHideVacation(vacation.id)}
                                                        className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 hover:bg-red-500 hover:text-white transition-all duration-300 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-600 hover:scale-110"
                                                        title="Eliminar de mi vista"
                                                    >
                                                        <i className="fa-solid fa-trash-can text-sm"></i>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="p-20 text-center">
                                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-200 dark:text-slate-600 border-2 border-dashed border-slate-100 dark:border-slate-700 transition-colors">
                                            <i className="fa-solid fa-calendar-xmark text-3xl"></i>
                                        </div>
                                        <h5 className="text-slate-400 dark:text-slate-500 font-black text-lg transition-colors">Historial Vacío</h5>
                                        <p className="text-slate-300 dark:text-slate-600 text-sm mt-1 max-w-xs mx-auto transition-colors">No tienes solicitudes que coincidan con los criterios de búsqueda.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Controles de Paginación Rediseñados */}
                {
                    totalPages > 1 && (
                        <div className="p-6 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between transition-colors">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">
                                Mostrando <span className="text-corporate dark:text-corporate-light">{indexOfFirstItem + 1}</span> a <span className="text-corporate dark:text-corporate-light">{Math.min(indexOfLastItem, sortedVacations.length)}</span> de {sortedVacations.length}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => changePage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:border-corporate dark:hover:border-corporate hover:text-corporate dark:hover:text-corporate-light disabled:opacity-30 transition-all font-black shadow-sm"
                                >
                                    <i className="fa-solid fa-chevron-left"></i>
                                </button>
                                <div className="flex gap-1">
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => changePage(i + 1)}
                                            className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${currentPage === i + 1 ? 'bg-corporate text-white shadow-lg shadow-corporate/20 scale-110' : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-600'}`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => changePage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:border-corporate dark:hover:border-corporate hover:text-corporate dark:hover:text-corporate-light disabled:opacity-30 transition-all font-black shadow-sm"
                                >
                                    <i className="fa-solid fa-chevron-right"></i>
                                </button>
                            </div>
                        </div>
                    )
                }
            </div >

            {/* Modal de Solicitud Unificada */}
            <AnimatePresence>
            {isAddModalOpen && (
                <ModalPortal>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-md flex items-start justify-center overflow-y-auto custom-scrollbar"
                    >
                        <div className="min-h-screen w-full flex items-center justify-center p-4 py-20">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-white/20 dark:border-slate-700 flex flex-col transition-all duration-500 scale-100"
                            >
                                <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-slate-50 dark:from-slate-800 to-white dark:to-slate-800 relative transition-colors">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-corporate opacity-[0.03] dark:opacity-10 rounded-full translate-x-8 -translate-y-8"></div>
                                    <div className="relative z-10">
                                        <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Nueva Solicitud</h3>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">Gestiona tu tiempo de forma flexible</p>
                                    </div>
                                    <button onClick={() => setIsAddModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400 transition-all group">
                                        <i className="fa-solid fa-xmark transition-transform group-hover:rotate-90"></i>
                                    </button>
                                </div>

                                <div className="p-8">
                                    {formError && (
                                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 rounded-r-2xl text-[10px] font-black uppercase tracking-wider transition-colors">
                                            <i className="fa-solid fa-triangle-exclamation mr-2"></i>
                                            {formError}
                                        </div>
                                    )}

                                    <form onSubmit={handleRequestVacation} className="space-y-6">
                                        {/* Selector de Modo (Días vs Horas) */}
                                        <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-[1.25rem] mb-6">
                                            <button 
                                                type="button"
                                                onClick={() => setRequestMode('days')}
                                                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${requestMode === 'days' ? 'bg-white dark:bg-slate-800 text-corporate shadow-md scale-[1.02]' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                            >
                                                <i className="fa-solid fa-calendar-range"></i>
                                                Días Completos
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setRequestMode('hours')}
                                                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${requestMode === 'hours' ? 'bg-white dark:bg-slate-800 text-corporate shadow-md scale-[1.02]' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                            >
                                                <i className="fa-solid fa-clock"></i>
                                                Horas Sueltas
                                            </button>
                                        </div>

                                        <div className="bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 space-y-6">
                                            {/* Selector de Tipo */}
                                            <div className="space-y-2">
                                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Tipo de Solicitud (Absentismo)</label>
                                                <div className="relative group">
                                                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all duration-300 ${
                                                        newVacation.type === 'vacation' ? 'bg-corporate/10 text-corporate shadow-sm ring-1 ring-corporate/20' : 
                                                        newVacation.type === 'overtime' ? 'bg-amber-100 text-amber-600 shadow-sm ring-1 ring-amber-400/20' :
                                                        newVacation.type === 'sick_leave' ? 'bg-red-50 text-red-500 shadow-sm ring-1 ring-red-400/20' : 
                                                        'bg-slate-100 text-slate-500 shadow-sm ring-1 ring-slate-400/20'
                                                    }`}>
                                                        <i className={`fa-solid ${
                                                            newVacation.type === 'vacation' ? 'fa-umbrella-beach' : 
                                                            newVacation.type === 'overtime' ? 'fa-clock' :
                                                            newVacation.type === 'sick_leave' ? 'fa-briefcase-medical' : 'fa-file-signature'
                                                        }`}></i>
                                                    </div>
                                                    <select
                                                        value={newVacation.type || 'vacation'}
                                                        onChange={e => setNewVacation({ ...newVacation, type: e.target.value })}
                                                        className="w-full pl-[4.5rem] pr-12 py-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 outline-none focus:border-corporate focus:ring-4 focus:ring-corporate/5 font-bold text-slate-700 dark:text-white transition-all appearance-none cursor-pointer shadow-sm hover:border-corporate/50"
                                                    >
                                                        <option value="vacation" className="font-bold py-2">Vacaciones Anuales</option>
                                                        {globalSettings?.allow_overtime_request === 'true' && <option value="overtime" className="font-bold py-2">Compensar Horas Extra</option>}
                                                        <option value="sick_leave" className="font-bold py-2">Baja Médica / Cita Médica</option>
                                                        <option value="other" className="font-bold py-2">Otros Asuntos Propios</option>
                                                    </select>
                                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2">
                                                        <div className="w-[1px] h-6 bg-slate-100 dark:bg-slate-700 mr-1"></div>
                                                        <i className="fa-solid fa-chevron-down text-[10px] text-slate-400 group-focus-within:rotate-180 transition-transform"></i>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Formulario Dinámico según Modo */}
                                            {requestMode === 'days' ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                                                    <div>
                                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Desde el día</label>
                                                        <input
                                                            type="date" required
                                                            value={newVacation.start_date}
                                                            onChange={e => setNewVacation({ ...newVacation, start_date: e.target.value })}
                                                            className="w-full px-5 py-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-corporate focus:ring-4 focus:ring-corporate/5 outline-none font-bold text-slate-700 dark:text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Hasta el día</label>
                                                        <input
                                                            type="date" required
                                                            value={newVacation.end_date}
                                                            onChange={e => setNewVacation({ ...newVacation, end_date: e.target.value })}
                                                            className="w-full px-5 py-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-corporate focus:ring-4 focus:ring-corporate/5 outline-none font-bold text-slate-700 dark:text-white"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Fecha del día</label>
                                                        <input
                                                            type="date" required
                                                            value={newVacation.start_date}
                                                            onChange={e => setNewVacation({ ...newVacation, start_date: e.target.value })}
                                                            className="w-full px-5 py-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-corporate focus:ring-4 focus:ring-corporate/5 outline-none font-bold text-slate-700 dark:text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Número de Horas</label>
                                                        <input
                                                            type="number" step="0.5" required
                                                            placeholder="Ej: 2.5"
                                                            value={newVacation.hours}
                                                            onChange={e => setNewVacation({ ...newVacation, hours: e.target.value })}
                                                            className="w-full px-5 py-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-corporate focus:ring-4 focus:ring-corporate/5 outline-none font-bold text-slate-700 dark:text-white"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Resumen dinámico del coste */}
                                            {requestMode === 'days' && newVacation.start_date && newVacation.end_date && (
                                                <div className="p-4 bg-corporate/5 dark:bg-corporate/10 rounded-2xl border border-corporate/10 flex items-center justify-between">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculando laborables...</span>
                                                    <span className="text-xl font-black text-corporate dark:text-corporate-light">
                                                        {(() => {
                                                            let start = new Date(newVacation.start_date);
                                                            let end = new Date(newVacation.end_date);
                                                            let count = 0;
                                                            let cur = new Date(start);
                                                            while (cur <= end) {
                                                                const day = cur.getDay();
                                                                const isWeekend = day === 0 || day === 6;
                                                                const isHoliday = holidays.some(h => new Date(h.date).toDateString() === cur.toDateString());
                                                                if (!isWeekend && !isHoliday) count++;
                                                                cur.setDate(cur.getDate() + 1);
                                                            }
                                                            return count;
                                                        })()} Días
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Comentario o Justificación</label>
                                            <textarea
                                                rows="2"
                                                value={newVacation.note}
                                                onChange={e => setNewVacation({ ...newVacation, note: e.target.value })}
                                                className="w-full px-5 py-4 bg-white dark:bg-slate-800 rounded-[1.5rem] border border-slate-100 dark:border-slate-700 focus:ring-4 focus:ring-corporate/5 focus:border-corporate outline-none transition-all font-medium text-slate-700 dark:text-slate-200 resize-none"
                                                placeholder="Ej: Cita médica especialista, tarde libre compensada..."
                                            ></textarea>
                                        </div>

                                        <div>
                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Adjuntar justificante (PDF/Imagen)</label>
                                            <div className="relative group/upload">
                                                <input
                                                    type="file"
                                                    id="vacation-attachment"
                                                    onChange={e => setSelectedFile(e.target.files[0])}
                                                    className="hidden"
                                                    accept=".pdf,.png,.jpg,.jpeg"
                                                />
                                                <label
                                                    htmlFor="vacation-attachment"
                                                    className="flex items-center justify-center w-full p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-corporate hover:bg-corporate/5 transition-all text-slate-400 group-hover/upload:text-corporate"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <i className={`fa-solid ${selectedFile ? 'fa-file-circle-check text-emerald-500' : 'fa-cloud-arrow-up'}`}></i>
                                                        <span className="text-[10px] font-black uppercase tracking-widest">
                                                            {selectedFile ? selectedFile.name : 'Sube un documento opcional'}
                                                        </span>
                                                    </div>
                                                </label>
                                                {selectedFile && (
                                                    <button 
                                                        type="button"
                                                        onClick={() => setSelectedFile(null)}
                                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-all"
                                                    >
                                                        <i className="fa-solid fa-xmark text-[10px]"></i>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-2 flex justify-between gap-3">
                                            <button 
                                                type="button" 
                                                onClick={(e) => handleRequestVacation(null, 'draft')} 
                                                className="px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
                                            >
                                                <i className="fa-regular fa-floppy-disk"></i>
                                                Borrador
                                            </button>
                                            <div className="flex gap-2">
                                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">
                                                    Cerrar
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    className="px-8 py-4 bg-corporate text-white rounded-[1.25rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-corporate/20 hover:shadow-corporate/40 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
                                                >
                                                    {isSubmitting ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-paper-plane"></i>}
                                                    Enviar Solicitud
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </ModalPortal>
            )}
            </AnimatePresence>
        </div>
    );
};

export default Vacations;