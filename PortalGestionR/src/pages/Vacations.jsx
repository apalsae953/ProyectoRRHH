import { useState, useEffect } from 'react';
import axios from '../api/axios';
import vacationService from '../services/vacationService';
import ModalPortal from '../components/ModalPortal';

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
    const [isOvertimeModalOpen, setIsOvertimeModalOpen] = useState(false);
    const [newVacation, setNewVacation] = useState({ start_date: '', end_date: '', note: '', type: 'vacation' });
    const [newOvertime, setNewOvertime] = useState({ date: '', hours: '', note: '' });
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
        formData.append('start_date', newVacation.start_date);
        formData.append('end_date', newVacation.end_date);
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
            setNewVacation({ start_date: '', end_date: '', note: '', type: 'vacation' });
            setSelectedFile(null);
            await fetchData();
        } catch (error) {
            setFormError(error.response?.data?.message || 'Error al solicitar vacaciones');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRequestOvertime = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormError('');
        try {
            await vacationService.requestVacation({
                start_date: newOvertime.date,
                end_date: newOvertime.date,
                hours: newOvertime.hours,
                note: newOvertime.note,
                type: 'overtime'
            });
            setIsOvertimeModalOpen(false);
            setNewOvertime({ date: '', hours: '', note: '' });
            await fetchData();
        } catch (error) {
            setFormError(error.response?.data?.message || 'Error al solicitar horas extra');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelVacation = async (id) => {
        const reason = window.prompt('Por favor, indica el motivo de la cancelación:');
        if (!reason) {
            alert('Debes indicar un motivo');
            return;
        }

        try {
            await vacationService.cancelVacation(id, reason);
            await fetchData();
            alert('Solicitud cancelada correctamente.');
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
        <div className="flex justify-center items-center h-full min-h-[400px]">
            <i className="fa-solid fa-circle-notch fa-spin text-4xl text-corporate opacity-20"></i>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in pb-10">

            {/* Cabecera y Botón de Nueva Solicitud */}
            <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden mb-6">
                <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Mis Vacaciones</h2>
                        <p className="text-slate-500 text-sm mt-1 font-medium">Gestiona tus días libres interrumpiendo tu jornada.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {globalSettings?.allow_overtime_request === 'true' && (
                            <button onClick={() => setIsOvertimeModalOpen(true)} className="bg-amber-100 hover:bg-amber-200 text-amber-700 font-bold py-2.5 px-5 rounded-xl transition-all shadow-sm flex items-center gap-2 group border border-amber-200">
                                <i className="fa-solid fa-clock transition-transform group-hover:scale-110"></i>
                                <span>Horas Extra</span>
                            </button>
                        )}
                        <button onClick={() => setIsAddModalOpen(true)} className="bg-corporate hover:bg-corporate-dark text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 group">
                            <i className="fa-solid fa-plus transition-transform group-hover:rotate-90"></i>
                            <span>Nueva Solicitud</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Alerta Informativa sobre Cálculo del Word */}
            <div className="mb-8 bg-corporate/5 border border-corporate/10 p-5 rounded-3xl flex items-start gap-4">
                <div className="w-10 h-10 bg-corporate text-white rounded-xl flex items-center justify-center shrink-0 shadow-md">
                    <i className="fa-solid fa-circle-info text-xl"></i>
                </div>
                <div>
                    <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                        ¿Cómo se calculan tus días?
                        <span className="text-[10px] bg-corporate/10 text-corporate px-2 py-0.5 rounded-full uppercase tracking-tighter">Regla Impuesta</span>
                    </h4>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        Tus vacaciones se generan día a día. Los <strong>Días Generados</strong> muestran lo que has devengado proporcionalmente hasta hoy (aprox. 1.83 días por mes).
                        Puedes solicitar días que aún no has generado, pero RRHH tendrá en cuenta tu saldo anual base ({balance?.dias_base_anuales || 22} días) para la aprobación.
                    </p>
                </div>
            </div>

            {/* Cabecera con estadísticas rápidas o balances */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 group/stats">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md hover:border-corporate/30 transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-corporate/5 rotate-45 translate-x-12 -translate-y-8 blur-2xl group-hover:bg-corporate/10 transition-colors"></div>
                    <div className="w-12 h-12 bg-corporate/10 text-corporate rounded-2xl flex items-center justify-center text-xl shadow-inner border border-corporate/20 shrink-0 z-10">
                        <i className="fa-regular fa-calendar"></i>
                    </div>
                    <div className="z-10">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Generados (Hasta hoy)</p>
                        <p className="text-3xl font-black text-slate-800 tracking-tight">{balance?.dias_generados_hasta_hoy || 0} <span className="text-sm font-bold text-slate-400">días</span></p>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">Base anual: {balance?.dias_base_anuales || 22} días</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md hover:border-amber-400/30 transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rotate-45 translate-x-12 -translate-y-8 blur-2xl group-hover:bg-amber-400/10 transition-colors"></div>
                    <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center text-xl shadow-inner border border-amber-200/50 shrink-0 z-10">
                        <i className="fa-solid fa-plane-departure"></i>
                    </div>
                    <div className="z-10">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Días Consumidos</p>
                        <p className="text-3xl font-black text-slate-800 tracking-tight">{balance?.dias_disfrutados || 0} <span className="text-sm font-bold text-slate-400">días</span></p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md hover:border-emerald-500/30 transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rotate-45 translate-x-12 -translate-y-8 blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl shadow-inner border border-emerald-200/50 shrink-0 z-10">
                        <i className="fa-solid fa-umbrella-beach"></i>
                    </div>
                    <div className="z-10">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Días Disponibles</p>
                        <p className="text-3xl font-black text-emerald-600 tracking-tight">{balance?.dias_totales_disponibles || 22} <span className="text-sm font-bold opacity-70">días</span></p>
                    </div>
                </div>

                {/* Próximos Festivos */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Próximos Festivos</h4>
                        <i className="fa-solid fa-calendar-day text-corporate"></i>
                    </div>
                    <div className="space-y-3">
                        {holidays.filter(h => new Date(h.date) >= new Date()).slice(0, 3).map(h => (
                            <div key={h.id} className="flex items-center gap-3">
                                <div className="text-[10px] font-bold bg-slate-50 text-slate-500 px-2 py-1 rounded-lg border border-slate-100 min-w-[70px] text-center shrink-0">
                                    {new Date(h.date).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
                                </div>
                                <span className="text-xs font-semibold text-slate-600 truncate">{h.description}</span>
                            </div>
                        ))}
                        {holidays.length === 0 && <p className="text-[10px] text-slate-400 italic">No hay festivos próximos</p>}
                    </div>
                </div>
            </div>

            {/* Tabla de Historial */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden" >
                {/* Barra de Búsqueda y Filtros */}
                <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row gap-5 items-center justify-between bg-white">
                    <div className="relative w-full md:w-96 group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <i className="fa-solid fa-magnifying-glass text-slate-300 group-focus-within:text-corporate transition-colors"></i>
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar en el historial..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-corporate/10 focus:border-corporate/40 transition-all text-sm font-medium"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="px-4 py-2 bg-corporate/5 text-corporate rounded-full text-[10px] font-black uppercase tracking-widest border border-corporate/10">
                            {filteredVacations.length} Solicitudes
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 cursor-pointer hover:text-corporate transition-colors" onClick={() => handleSort('fecha_inicio')}>
                                    <div className="flex items-center gap-2">
                                        Periodo de Descanso
                                        {sortKey === 'fecha_inicio' && (sortDirection === 'asc' ? <i className="fa-solid fa-arrow-up-short-wide"></i> : <i className="fa-solid fa-arrow-down-short-wide"></i>)}
                                    </div>
                                </th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 text-center">Duración</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 cursor-pointer hover:text-corporate transition-colors" onClick={() => handleSort('estado')}>
                                    Estado
                                </th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 text-right">Gestión</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {currentItems.length > 0 ? (
                                currentItems.map((vacation) => (
                                    <tr key={vacation.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl bg-white border border-slate-100 flex flex-col items-center justify-center shadow-sm group-hover:border-corporate/30 group-hover:shadow-md transition-all ${vacation.tipo === 'overtime' ? 'bg-amber-50/30' : ''}`}>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase">{new Date(vacation.fecha_inicio).toLocaleString('es', { month: 'short' })}</span>
                                                    <span className={`text-lg font-black leading-none ${vacation.tipo === 'overtime' ? 'text-amber-600' : 'text-slate-800'}`}>{new Date(vacation.fecha_inicio).getDate()}</span>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        {vacation.tipo === 'overtime' ? (
                                                            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Horas Extra</span>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-slate-700">{new Date(vacation.fecha_inicio).toLocaleDateString()}</span>
                                                                <i className="fa-solid fa-arrow-right text-[10px] text-slate-300"></i>
                                                                <span className="font-bold text-slate-700">{new Date(vacation.fecha_fin).toLocaleDateString()}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {vacation.nota && (
                                                        <p className="text-xs text-slate-400 font-medium italic truncate max-w-[200px]">{vacation.nota}</p>
                                                    )}
                                                    {vacation.tipo === 'overtime' && (
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Realizadas el {new Date(vacation.fecha_inicio).toLocaleDateString()}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 text-center">
                                            <div className="inline-flex flex-col items-center">
                                                {vacation.tipo === 'overtime' ? (
                                                    <>
                                                        <span className="text-lg font-black text-amber-600">{vacation.horas || 0}</span>
                                                        <span className="text-[9px] font-black text-amber-400 uppercase tracking-tighter">Horas Extra</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="text-lg font-black text-slate-800">{vacation.dias_solicitados}</span>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Días Lab.</span>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col gap-1.5">
                                                {renderStatus(vacation.estado || 'pending')}
                                                {vacation.mensaje_admin && (
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 pl-1">
                                                        <i className="fa-solid fa-comment-dots text-corporate/40"></i>
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
                                                        className="w-10 h-10 rounded-xl bg-corporate/5 text-corporate hover:bg-corporate hover:text-white transition-all duration-300 flex items-center justify-center shadow-sm border border-corporate/10"
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
                                                        className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 hover:bg-amber-500 hover:text-white transition-all duration-300 flex items-center justify-center shadow-sm border border-amber-100 hover:scale-110"
                                                        title="Cancelar Solicitud"
                                                    >
                                                        <i className="fa-solid fa-ban text-sm"></i>
                                                    </button>
                                                )}
                                                {(vacation.estado === 'canceled' || vacation.estado === 'rejected' || new Date(vacation.fecha_fin) < new Date()) && (
                                                    <button
                                                        onClick={() => handleHideVacation(vacation.id)}
                                                        className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-500 hover:text-white transition-all duration-300 flex items-center justify-center shadow-sm border border-slate-100 hover:scale-110"
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
                                        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-200 border-2 border-dashed border-slate-100">
                                            <i className="fa-solid fa-calendar-xmark text-3xl"></i>
                                        </div>
                                        <h5 className="text-slate-400 font-black text-lg">Historial Vacío</h5>
                                        <p className="text-slate-300 text-sm mt-1 max-w-xs mx-auto">No tienes solicitudes que coincidan con los criterios de búsqueda.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Controles de Paginación Rediseñados */}
                {
                    totalPages > 1 && (
                        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Mostrando <span className="text-corporate">{indexOfFirstItem + 1}</span> a <span className="text-corporate">{Math.min(indexOfLastItem, sortedVacations.length)}</span> de {sortedVacations.length}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => changePage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:border-corporate hover:text-corporate disabled:opacity-30 transition-all font-black shadow-sm"
                                >
                                    <i className="fa-solid fa-chevron-left"></i>
                                </button>
                                <div className="flex gap-1">
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => changePage(i + 1)}
                                            className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${currentPage === i + 1 ? 'bg-corporate text-white shadow-lg shadow-corporate/20 scale-110' : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'}`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => changePage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:border-corporate hover:text-corporate disabled:opacity-30 transition-all font-black shadow-sm"
                                >
                                    <i className="fa-solid fa-chevron-right"></i>
                                </button>
                            </div>
                        </div>
                    )
                }
            </div >

            {/* Modal para solicitar vacaciones (Rediseño Rango Claro) */}
            {/* Modal de Solicitud de Vacaciones */}
            {
                isAddModalOpen && (
                    <ModalPortal>
                        <div className="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-md animate-fade-in flex items-start justify-center overflow-y-auto custom-scrollbar">
                            <div className="min-h-screen w-full flex items-center justify-center p-4 py-20">
                                <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-white/20 flex flex-col transition-all duration-500 scale-100">
                                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white relative">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-corporate opacity-[0.03] rounded-full translate-x-8 -translate-y-8"></div>
                                    <div className="relative z-10">
                                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Solicitar Vacaciones</h3>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Define tu periodo de descanso</p>
                                    </div>
                                    <button onClick={() => setIsAddModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all group">
                                        <i className="fa-solid fa-xmark transition-transform group-hover:rotate-90"></i>
                                    </button>
                                </div>
                                <div className="p-8">
                                    {formError && (
                                        <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-2xl text-xs font-black uppercase tracking-wider animate-bounce">
                                            <i className="fa-solid fa-triangle-exclamation mr-2"></i>
                                            {formError}
                                        </div>
                                    )}
                                    <form onSubmit={handleRequestVacation} className="space-y-8">
                                        <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="w-10 h-10 rounded-xl bg-corporate/10 text-corporate flex items-center justify-center text-lg">
                                                    <i className="fa-solid fa-calendar"></i>
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-xs font-black color-black uppercase tracking-[0.2em]">Rango de Fechas Continuo</h4>
                                                    <p className="text-[10px] font-bold italic mt-0.5">* Sábados, Domingos y Festivos NO restan saldo.</p>
                                                </div>
                                            </div>

                                            <div className="mb-8 p-6 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center gap-5">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm border transition-all duration-300 ${
                                                    newVacation.type === 'vacation' ? 'bg-corporate/10 text-corporate border-corporate/20 shadow-corporate/10' : 
                                                    newVacation.type === 'sick_leave' ? 'bg-red-50 text-red-500 border-red-100 shadow-red-100' : 
                                                    'bg-slate-100 text-slate-500 border-slate-200 shadow-slate-100'
                                                }`}>
                                                    <i className={`fa-solid ${
                                                        newVacation.type === 'vacation' ? 'fa-umbrella-beach' : 
                                                        newVacation.type === 'sick_leave' ? 'fa-briefcase-medical' : 
                                                        'fa-file-signature'
                                                    }`}></i>
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Tipo de Solicitud (Absentismo)</label>
                                                    <select
                                                        value={newVacation.type || 'vacation'}
                                                        onChange={e => setNewVacation({ ...newVacation, type: e.target.value })}
                                                        className="w-full h-12 px-4 bg-white rounded-xl border border-slate-200 focus:border-corporate focus:ring-4 focus:ring-corporate/5 outline-none transition-all font-bold text-slate-700 shadow-sm"
                                                    >
                                                        <option value="vacation">Vacaciones Anuales (Descuenta Saldo)</option>
                                                        <option value="sick_leave">Baja Médica / Contingencia</option>
                                                        <option value="other">Asuntos Propios / Otros</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                                                <div className="relative">
                                                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest pl-1">Desde el día...</label>
                                                    <div className="relative group">
                                                        <i className="fa-solid fa-calendar-day absolute left-4 top-1/2 -translate-y-1/2 text-corporate/30 group-focus-within:text-corporate transition-colors"></i>
                                                        <input
                                                            type="date" required
                                                            value={newVacation.start_date}
                                                            onChange={e => setNewVacation({ ...newVacation, start_date: e.target.value })}
                                                            className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-200 focus:border-corporate focus:ring-[6px] focus:ring-corporate/5 outline-none transition-all font-bold text-slate-700"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="relative">
                                                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest pl-1">Hasta el día...</label>
                                                    <div className="relative group">
                                                        <i className="fa-solid fa-calendar-check absolute left-4 top-1/2 -translate-y-1/2 text-corporate/30 group-focus-within:text-corporate transition-colors"></i>
                                                        <input
                                                            type="date" required
                                                            value={newVacation.end_date}
                                                            onChange={e => setNewVacation({ ...newVacation, end_date: e.target.value })}
                                                            className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-200 focus:border-corporate focus:ring-[6px] focus:ring-corporate/5 outline-none transition-all font-bold text-slate-700"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="hidden md:block absolute left-1/2 top-11 -translate-x-1/2 text-slate-200">
                                                    <i className="fa-solid fa-arrow-right-long text-xl"></i>
                                                </div>
                                            </div>

                                            {newVacation.start_date && newVacation.end_date && (
                                                <div className="mt-8 space-y-4">
                                                    <div className="flex items-center justify-between p-4 bg-corporate/5 rounded-2xl border border-corporate/10">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-corporate shadow-sm">
                                                                <i className="fa-solid fa-calculator"></i>
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Laborables</span>
                                                                <span className="text-xl font-black text-corporate">
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
                                                                    })()} días
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-white rounded-2xl border border-slate-100 p-4 max-h-40 overflow-y-auto custom-scrollbar">
                                                        <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                            <i className="fa-solid fa-list-check"></i>
                                                            Desglose del periodo
                                                        </h5>
                                                        <div className="flex flex-wrap gap-2">
                                                            {(() => {
                                                                let start = new Date(newVacation.start_date);
                                                                let end = new Date(newVacation.end_date);
                                                                let days = [];
                                                                let cur = new Date(start);
                                                                while (cur <= end) {
                                                                    const day = cur.getDay();
                                                                    const isWeekend = day === 0 || day === 6;
                                                                    const isHoliday = holidays.find(h => new Date(h.date).toDateString() === cur.toDateString());
                                                                    days.push({
                                                                        date: new Date(cur),
                                                                        isWorking: !isWeekend && !isHoliday,
                                                                        type: isWeekend ? 'weekend' : (isHoliday ? 'holiday' : 'working'),
                                                                        label: isHoliday ? isHoliday.description : (isWeekend ? 'Finde' : '')
                                                                    });
                                                                    cur.setDate(cur.getDate() + 1);
                                                                }
                                                                return days.map((d, i) => (
                                                                    <div key={i} className={`px-3 py-1.5 rounded-xl text-[9px] font-black border flex flex-col items-center min-w-[50px] ${d.isWorking ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-300 opacity-60'}`}>
                                                                        <span>{d.date.getDate()} {monthNames[d.date.getMonth()].substring(0, 3)}</span>
                                                                        {d.label && <span className="text-[7px] truncate max-w-[40px] mt-0.5">{d.label}</span>}
                                                                    </div>
                                                                ));
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-slate-700 mb-2 uppercase tracking-widest pl-1">Motivo o comentario adicional</label>
                                            <textarea
                                                value={newVacation.note}
                                                onChange={e => setNewVacation({ ...newVacation, note: e.target.value })}
                                                rows="2"
                                                className="w-full px-5 py-4 bg-white rounded-[1.5rem] border border-slate-200 focus:border-corporate focus:ring-[6px] focus:ring-corporate/5 outline-none transition-all resize-none font-medium text-slate-700"
                                                placeholder="Detalla si es necesario algún motivo especial..."
                                            ></textarea>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-slate-700 mb-2 uppercase tracking-widest pl-1">Adjuntar documento (Opcional)</label>
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
                                                    className="flex items-center justify-center w-full p-4 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-corporate hover:bg-corporate/5 transition-all text-slate-400 group-hover/upload:text-corporate"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <i className={`fa-solid ${selectedFile ? 'fa-file-circle-check text-emerald-500' : 'fa-cloud-arrow-up'}`}></i>
                                                        <span className="text-[10px] font-black uppercase tracking-widest">
                                                            {selectedFile ? selectedFile.name : 'Sube un justificante o documento'}
                                                        </span>
                                                    </div>
                                                </label>
                                                {selectedFile && (
                                                    <button 
                                                        type="button"
                                                        onClick={() => setSelectedFile(null)}
                                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                                                    >
                                                        <i className="fa-solid fa-xmark text-[10px]"></i>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-2 flex justify-between gap-3">
                                            <button 
                                                type="button" 
                                                disabled={isSubmitting}
                                                onClick={(e) => handleRequestVacation(null, 'draft')} 
                                                className="px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all flex items-center gap-2 border border-transparent hover:border-slate-200"
                                            >
                                                <i className="fa-regular fa-floppy-disk"></i>
                                                Guardar Borrador
                                            </button>
                                            <div className="flex gap-2">
                                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">
                                                    Cerrar
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    className="px-8 py-4 bg-gradient-to-r from-corporate to-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-corporate/20 hover:shadow-corporate/40 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-70 flex items-center gap-3"
                                                >
                                                    {isSubmitting ? (
                                                        <><i className="fa-solid fa-circle-notch fa-spin"></i> Enviando...</>
                                                    ) : (
                                                        <><i className="fa-solid fa-paper-plane text-xs"></i> Lanzar Solicitud</>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
                )
            }

            {/* Modal de Solicitud de Horas Extra */}
            {isOvertimeModalOpen && (
                <ModalPortal>
                    <div className="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-md animate-fade-in flex items-start justify-center overflow-y-auto custom-scrollbar">
                        <div className="min-h-screen w-full flex items-center justify-center p-4 py-20">
                            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 flex flex-col transition-all duration-500 scale-100">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-amber-50 to-white relative">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400 opacity-[0.03] rounded-full translate-x-8 -translate-y-8"></div>
                                <div className="relative z-10">
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Compensar Horas Extra</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Solicita tus horas trabajadas de más</p>
                                </div>
                                <button onClick={() => setIsOvertimeModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-amber-100 text-amber-500 hover:bg-red-50 hover:text-red-500 transition-all group">
                                    <i className="fa-solid fa-xmark transition-transform group-hover:rotate-90"></i>
                                </button>
                            </div>
                            <div className="p-8">
                                {formError && (
                                    <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-2xl text-xs font-black uppercase tracking-wider">
                                        {formError}
                                    </div>
                                )}
                                <form onSubmit={handleRequestOvertime} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest pl-1">Fecha del trabajo</label>
                                            <input
                                                type="date" required
                                                value={newOvertime.date}
                                                onChange={e => setNewOvertime({ ...newOvertime, date: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/5 outline-none transition-all font-bold text-slate-700"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest pl-1">Horas realizadas</label>
                                            <input
                                                type="number" step="0.5" required
                                                value={newOvertime.hours}
                                                onChange={e => setNewOvertime({ ...newOvertime, hours: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/5 outline-none transition-all font-bold text-slate-700"
                                                placeholder="Ej: 4.5"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest pl-1">Descripción de la tarea</label>
                                        <textarea
                                            value={newOvertime.note}
                                            onChange={e => setNewOvertime({ ...newOvertime, note: e.target.value })}
                                            rows="3"
                                            className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/5 outline-none transition-all resize-none font-medium text-slate-700"
                                            placeholder="Indica qué tarea se realizó..."
                                        ></textarea>
                                    </div>
                                    <div className="pt-2 flex justify-end gap-3">
                                        <button type="button" onClick={() => setIsOvertimeModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-100 transition-all">
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="px-8 py-3 bg-amber-400 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-amber-400/20 hover:shadow-amber-400/40 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-70"
                                        >
                                            Solicitar
                                        </button>
                                    </div>
                                </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
};

export default Vacations;