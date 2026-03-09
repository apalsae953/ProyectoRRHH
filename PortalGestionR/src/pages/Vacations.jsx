import { useState, useEffect } from 'react';
import vacationService from '../services/vacationService';

const Vacations = () => {
    const [vacations, setVacations] = useState([]);
    const [balance, setBalance] = useState(null);
    const [loading, setLoading] = useState(true);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newVacation, setNewVacation] = useState({ start_date: '', end_date: '', note: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    // Paginación y Ordenamiento
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortKey, setSortKey] = useState('fecha_inicio');
    const [sortDirection, setSortDirection] = useState('desc');
    const itemsPerPage = 10;

    const fetchData = async () => {
        setLoading(true);
        try {
            const [vacationsRes, balanceRes] = await Promise.all([
                vacationService.getMyVacations(),
                vacationService.getMyBalance().catch(() => null)
            ]);

            setVacations(vacationsRes.data?.data || vacationsRes.data || []);
            const balanceData = balanceRes?.data?.data || balanceRes?.data || {
                dias_generados_hasta_hoy: 0,
                dias_disfrutados: 0,
                dias_totales_disponibles: 0,
                dias_base_anuales: 22
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
        setCurrentPage(1); // Reset to first page on sort change
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

        // Handle date sorting
        if (sortKey.includes('fecha')) {
            const dateA = new Date(aValue);
            const dateB = new Date(bValue);
            if (dateA < dateB) return sortDirection === 'asc' ? -1 : 1;
            if (dateA > dateB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        }

        // Handle string/number sorting
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

    const handleRequestVacation = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormError('');
        try {
            await vacationService.requestVacation(newVacation);
            setIsAddModalOpen(false);
            setNewVacation({ start_date: '', end_date: '', note: '' });
            await fetchData();
        } catch (error) {
            setFormError(error.response?.data?.message || 'Error al solicitar vacaciones');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelVacation = async (id) => {
        const reason = window.prompt('Por favor, indica el motivo de la cancelación:');
        if (!reason || reason.length < 5) {
            alert('Debes indicar un motivo de al menos 5 caracteres.');
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
            pending: 'bg-amber-50 text-amber-700 border-amber-200',
            approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            rejected: 'bg-red-50 text-red-700 border-red-200',
            canceled: 'bg-slate-50 text-slate-700 border-slate-200',
        };
        const icons = {
            pending: 'fa-regular fa-clock',
            approved: 'fa-solid fa-check',
            rejected: 'fa-solid fa-xmark',
            canceled: 'fa-solid fa-ban',
        };
        const labels = {
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
                    <button onClick={() => setIsAddModalOpen(true)} className="bg-corporate hover:bg-corporate-dark text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 group">
                        <i className="fa-solid fa-plus transition-transform group-hover:rotate-90"></i>
                        <span>Nueva Solicitud</span>
                    </button>
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
                        Puedes solicitar días que aún no has generado, pero RRHH tendrá en cuenta tu saldo anual base (22 días) para la aprobación.
                    </p>
                </div>
            </div>

            {/* Cabecera con estadísticas rápidas o balances */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 group/stats">
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
            </div>

            {/* Tabla de Historial */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-slate-800">Historial de Solicitudes</h3>
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 font-bold rounded-full text-xs border border-slate-200">
                            <i className="fa-solid fa-list-ul mr-1.5"></i>
                            {vacations.length} peticiones
                        </span>
                    </div>

                    <div className="relative w-full md:w-80">
                        <i className="fa-solid fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
                        <input
                            type="text"
                            placeholder="Buscar por fecha, estado o nota..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-11 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-corporate/20 focus:border-corporate/50 transition-all text-sm shadow-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto p-6 md:p-8">
                    <table className="w-full text-left border-separate border-spacing-y-3">
                        <thead>
                            <tr className="text-slate-400 text-xs font-bold uppercase tracking-widest px-4">
                                <th className="px-4 pb-2 font-bold cursor-pointer hover:text-corporate transition-colors" onClick={() => handleSort('fecha_inicio')}>
                                    Fecha Inicio {sortKey === 'fecha_inicio' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="px-4 pb-2 font-bold cursor-pointer hover:text-corporate transition-colors" onClick={() => handleSort('fecha_fin')}>
                                    Fecha Fin {sortKey === 'fecha_fin' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="px-4 pb-2 font-bold text-center">Días</th>
                                <th className="px-4 pb-2 font-bold cursor-pointer hover:text-corporate transition-colors" onClick={() => handleSort('estado')}>
                                    Estado {sortKey === 'estado' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="px-4 pb-2 font-bold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {currentItems.length > 0 ? (
                                currentItems.map((vacation) => (
                                    <tr key={vacation.id} className="bg-white shadow-[0_0_15px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-300 rounded-2xl group border border-slate-50">
                                        <td className="p-4 rounded-l-2xl border-t border-b border-l border-slate-100 group-hover:border-corporate/20 transition-colors">
                                            <div className="font-medium text-slate-700">
                                                {vacation.fecha_inicio}
                                            </div>
                                            {vacation.nota && (
                                                <div className="text-xs text-slate-500 italic mt-1 font-medium bg-slate-100 p-2 rounded-lg break-words max-w-xs">
                                                    <i className="fa-solid fa-quote-left mr-1 opacity-50"></i>
                                                    {vacation.nota}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 border-t border-b border-slate-100 group-hover:border-corporate/20 transition-colors font-medium text-slate-700">
                                            {vacation.fecha_fin}
                                        </td>
                                        <td className="p-4 text-center border-t border-b border-slate-100 group-hover:border-corporate/20 transition-colors">
                                            <span className="font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg">
                                                {vacation.dias_solicitados}
                                            </span>
                                        </td>
                                        <td className="p-4 border-t border-b border-slate-100 group-hover:border-corporate/20 transition-colors">
                                            <div className="mb-1">{renderStatus(vacation.estado || 'pending')}</div>
                                            {vacation.mensaje_admin && (
                                                <div className={"text-xs italic font-medium p-2 rounded-lg break-words mt-1 max-w-xs inline-block " + (vacation.estado === 'approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
                                                    <i className="fa-solid fa-reply mr-1 opacity-50"></i>
                                                    {vacation.mensaje_admin}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-right rounded-r-2xl border-t border-b border-r border-slate-100 group-hover:border-corporate/20 transition-colors">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Botón Cancelar: Si está pendiente o aprobada */}
                                                {(vacation.estado === 'pending' || vacation.estado === 'approved') && (
                                                    <button
                                                        onClick={() => handleCancelVacation(vacation.id)}
                                                        className="text-amber-500 hover:text-amber-600 bg-amber-50 hover:bg-amber-100 font-bold px-3 py-2 rounded-xl transition-all shadow-sm text-xs flex items-center gap-1"
                                                        title="Cancelar solicitud"
                                                    >
                                                        <i className="fa-solid fa-ban"></i>
                                                        <span className="hidden lg:inline">Cancelar</span>
                                                    </button>
                                                )}

                                                {/* Botón Borrar/Papelera: Si está cancelada, rechazada o es pasada */}
                                                {(vacation.estado === 'canceled' || vacation.estado === 'rejected' || new Date(vacation.fecha_fin) < new Date()) && (
                                                    <button
                                                        onClick={() => handleHideVacation(vacation.id)}
                                                        className="text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 font-bold w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-sm"
                                                        title="Eliminar del historial"
                                                    >
                                                        <i className="fa-solid fa-trash-can"></i>
                                                    </button>
                                                )}

                                                {/* Fallback si no hay acciones */}
                                                {!(vacation.estado === 'pending' || vacation.estado === 'approved' || vacation.estado === 'canceled' || vacation.estado === 'rejected' || new Date(vacation.fecha_fin) < new Date()) && (
                                                    <span className="text-slate-300 text-xs font-medium italic select-none">Sin acciones</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center border-t border-b border-l border-r border-slate-100 rounded-2xl border-dashed">
                                        <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                                            <i className="fa-regular fa-folder-open"></i>
                                        </div>
                                        <p className="text-slate-500 font-bold">No hay solicitudes registradas.</p>
                                        <p className="text-slate-400 text-sm mt-1">Cuando pidas vacaciones aparecerán aquí.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Controles de Paginación */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-6 bg-slate-50/50 border-t border-slate-100">
                        <span className="text-sm text-slate-500 font-medium">
                            Mostrando <span className="font-bold text-corporate">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedVacations.length)}</span> de <span className="font-bold text-slate-800">{sortedVacations.length}</span>
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => changePage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={'px-3 py-1.5 rounded-lg text-sm font-bold border ' + (currentPage === 1 ? 'border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed' : 'border-slate-200 text-slate-600 bg-white hover:bg-corporate/5 hover:text-corporate transition-all')}
                            >
                                Anterior
                            </button>
                            <div className="flex gap-1">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => changePage(i + 1)}
                                        className={'w-8 h-8 rounded-lg text-sm font-bold transition-all ' + (currentPage === i + 1 ? 'bg-corporate text-white shadow-md' : 'text-slate-500 hover:bg-slate-100')}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => changePage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className={'px-3 py-1.5 rounded-lg text-sm font-bold border ' + (currentPage === totalPages ? 'border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed' : 'border-slate-200 text-slate-600 bg-white hover:bg-corporate/5 hover:text-corporate transition-all')}
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal para solicitar vacaciones */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-xl font-bold text-slate-800">Solicitar Vacaciones</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 hover:text-slate-700 transition-colors">
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <div className="p-6">
                            {formError && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
                                    <i className="fa-solid fa-circle-exclamation mr-2"></i>
                                    {formError}
                                </div>
                            )}
                            <form onSubmit={handleRequestVacation} className="space-y-5">
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Fecha Inicio</label>
                                        <input type="date" required value={newVacation.start_date} onChange={e => setNewVacation({ ...newVacation, start_date: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-corporate focus:ring-2 focus:ring-corporate/20 outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Fecha Fin</label>
                                        <input type="date" required value={newVacation.end_date} onChange={e => setNewVacation({ ...newVacation, end_date: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-corporate focus:ring-2 focus:ring-corporate/20 outline-none transition-all" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Motivo o Notas (Opcional)</label>
                                    <textarea value={newVacation.note} onChange={e => setNewVacation({ ...newVacation, note: e.target.value })} rows="3" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-corporate focus:ring-2 focus:ring-corporate/20 outline-none transition-all resize-none" placeholder="Añade algún comentario para RRHH..."></textarea>
                                </div>
                                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                                        Cancelar
                                    </button>
                                    <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 rounded-xl font-bold bg-corporate hover:bg-corporate-dark text-white transition-colors shadow-md flex items-center gap-2 disabled:opacity-70">
                                        {isSubmitting ? (
                                            <><i className="fa-solid fa-spinner fa-spin"></i> Solicitando...</>
                                        ) : (
                                            <><i className="fa-solid fa-paper-plane"></i> Enviar Solicitud</>
                                        )}
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

export default Vacations;