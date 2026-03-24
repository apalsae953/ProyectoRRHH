import { useState, useEffect } from 'react';
import vacationService from '../services/vacationService';

const AdminVacations = () => {
    const [vacations, setVacations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // Para saber qué botón está cargando
    const [actionModal, setActionModal] = useState({ isOpen: false, id: null, type: null, message: '' });

    // Paginación, Ordenamiento y Búsqueda
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortKey, setSortKey] = useState('fecha_inicio');
    const [sortDirection, setSortDirection] = useState('desc');
    const itemsPerPage = 10;

    const fetchAllVacations = async () => {
        try {
            const response = await vacationService.getAllVacations();
            setVacations(response.data?.data || response.data || []);
        } catch (error) {
            console.error("Error al cargar todas las vacaciones", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllVacations();
    }, []);

    const openActionModal = (id, type) => {
        setActionModal({ isOpen: true, id, type, message: '' });
    };

    const confirmAction = async () => {
        const { id, type, message } = actionModal;
        setActionLoading(id);
        setActionModal({ isOpen: false, id: null, type: null, message: '' });
        try {
            if (type === 'approve') {
                await vacationService.approveVacation(id, message);
            } else if (type === 'reject') {
                await vacationService.rejectVacation(id, message);
            } else if (type === 'cancel') {
                await vacationService.cancelVacation(id, message);
            }
            await fetchAllVacations();
            
            // Notificar al Layout que hay cambios (para el Toast y la campana)
            window.dispatchEvent(new CustomEvent('refresh-notifications'));
            window.dispatchEvent(new CustomEvent('show-toast', { 
                detail: { 
                    message: type === 'approve' ? 'Solicitud aprobada correctamente' : 
                             type === 'reject' ? 'Solicitud rechazada correctamente' : 
                             'Solicitud cancelada correctamente',
                    type: 'success'
                } 
            }));
        } catch (error) {
            alert(error.response?.data?.message || 'Error al procesar la solicitud');
        } finally {
            setActionLoading(null);
        }
    };

    // Lógica de Ordenamiento
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortKey === key && sortDirection === 'asc') direction = 'desc';
        setSortKey(key);
        setSortDirection(direction);
    };

    const filteredVacations = vacations.filter(v => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        const fullName = `${v.empleado?.nombre || ''} ${v.empleado?.apellidos || ''}`.toLowerCase();
        return (
            fullName.includes(searchLower) ||
            (v.estado && v.estado.toLowerCase().includes(searchLower)) ||
            (v.tipo && v.tipo.toLowerCase().includes(searchLower))
        );
    });

    const sortedVacations = [...filteredVacations].sort((a, b) => {
        let aValue, bValue;

        if (sortKey === 'empleado') {
            aValue = `${a.empleado?.nombre || ''} ${a.empleado?.apellidos || ''}`.toLowerCase();
            bValue = `${b.empleado?.nombre || ''} ${b.empleado?.apellidos || ''}`.toLowerCase();
        } else if (sortKey === 'tipo') {
            aValue = a.tipo === 'overtime' ? 'horas extra' : 'vacaciones';
            bValue = b.tipo === 'overtime' ? 'horas extra' : 'vacaciones';
        } else {
            aValue = a[sortKey];
            bValue = b[sortKey];
        }

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
        // Scroll suave al inicio de la tabla
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const renderStatus = (status) => {
        const styles = {
            pending: 'bg-amber-100 text-amber-700 border-amber-200',
            approved: 'bg-green-100 text-green-700 border-green-200',
            rejected: 'bg-red-100 text-red-700 border-red-200',
            canceled: 'bg-orange-100 text-orange-700 border-orange-200',
        };
        const labels = {
            pending: { text: 'Pendiente', icon: 'fa-regular fa-clock' },
            approved: { text: 'Aprobado', icon: 'fa-solid fa-check' },
            rejected: { text: 'Rechazado', icon: 'fa-solid fa-xmark' },
            canceled: { text: 'Cancelado', icon: 'fa-solid fa-ban' }
        };

        const labelInfo = labels[status] || labels.pending;

        return (
            <span className={'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ' + (styles[status] || styles.pending)}>
                <i className={labelInfo.icon}></i>
                {labelInfo.text}
            </span>
        );
    };

    if (loading) return (
        <div className="space-y-6 animate-fade-in w-full">
            {/* Header Skeleton */}
            <div>
                <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse mb-2"></div>
                <div className="h-4 w-80 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
            </div>

            {/* Table Area Skeleton */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="p-5 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                    <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                    <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
                </div>
                
                <div className="p-5 border-b border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <div className="h-10 w-full sm:w-96 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse"></div>
                </div>

                <div className="p-6">
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-16 w-full bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 animate-pulse"></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Gestión de Vacaciones</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Aprueba o rechaza las solicitudes de los empleados</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="p-5 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Bandeja de Entrada</h3>
                    <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-500 text-xs font-bold rounded-full border border-amber-200 dark:border-amber-800">
                        {vacations.filter(v => v.estado === 'pending').length} Pendientes
                    </span>
                </div>

                <div className="p-5 border-b border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800">
                    <div className="relative w-full sm:w-96">
                        <i className="fa-solid fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500"></i>
                        <input
                            type="text"
                            placeholder="Buscar por empleado o estado..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-11 pr-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-corporate/20 focus:border-corporate/50 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white dark:bg-slate-800 text-gray-400 dark:text-slate-500 text-xs uppercase tracking-wider border-b border-gray-100 dark:border-slate-700">
                                <th className="p-4 font-bold cursor-pointer hover:text-corporate transition-colors" onClick={() => handleSort('empleado')}>
                                    Empleado {sortKey === 'empleado' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="p-4 font-bold cursor-pointer hover:text-corporate transition-colors" onClick={() => handleSort('fecha_inicio')}>
                                    Fechas {sortKey === 'fecha_inicio' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="p-4 font-bold cursor-pointer hover:text-corporate transition-colors" onClick={() => handleSort('tipo')}>
                                    Tipo {sortKey === 'tipo' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="p-4 font-bold text-center cursor-pointer hover:text-corporate transition-colors" onClick={() => handleSort('dias_solicitados')}>
                                    Días {sortKey === 'dias_solicitados' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="p-4 font-bold cursor-pointer hover:text-corporate transition-colors" onClick={() => handleSort('estado')}>
                                    Estado {sortKey === 'estado' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="p-4 font-bold text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                            {currentItems.map((vacation) => (
                                <tr key={vacation.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="p-4">
                                        <p className="font-bold text-gray-900 dark:text-white">{vacation.empleado?.nombre || ('Aspirante')}</p>
                                        {vacation.nota && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-1 font-medium bg-slate-100 dark:bg-slate-700/50 p-2 rounded-lg break-words">
                                                <i className="fa-solid fa-quote-left mr-1 opacity-50"></i>
                                                {vacation.nota}
                                            </p>
                                        )}
                                        {vacation.mensaje_admin && vacation.estado !== 'canceled' && (
                                             <p className={"text-xs italic mt-1 font-medium p-2 rounded-lg break-words " + (vacation.estado === 'approved' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400')}>
                                                 <i className="fa-solid fa-reply mr-1 opacity-50"></i>
                                                 {vacation.mensaje_admin}
                                             </p>
                                         )}
                                         {vacation.motivo_cancelacion && (
                                             <p className="text-xs italic mt-1 font-medium p-2 rounded-lg break-words bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                                                 <i className="fa-solid fa-ban mr-1 opacity-50"></i>
                                                 Motivo anulación: {vacation.motivo_cancelacion}
                                             </p>
                                         )}
                                    </td>
                                    <td className="p-4 text-sm font-semibold text-gray-600 dark:text-slate-300">
                                        <div className="flex flex-col">
                                            <span>{vacation.fecha_inicio}</span>
                                            <span className="text-[10px] text-gray-400 dark:text-slate-500 font-normal">hasta {vacation.fecha_fin}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {vacation.tipo === 'overtime' ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800 text-[10px] font-black uppercase">
                                                <i className="fa-solid fa-clock-rotate-left"></i>
                                                Horas Extra
                                            </span>
                                        ) : vacation.tipo === 'sick_leave' ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800 text-[10px] font-black uppercase">
                                                <i className="fa-solid fa-hospital-user"></i>
                                                Baja Médica
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800 text-[10px] font-black uppercase">
                                                <i className="fa-solid fa-umbrella-beach"></i>
                                                Vacaciones
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center font-bold text-corporate dark:text-blue-400">
                                        <div className="flex flex-col">
                                            <span>{vacation.dias_solicitados || '0'}</span>
                                            {vacation.horas && <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{vacation.horas}h</span>}
                                        </div>
                                    </td>
                                    <td className="p-4">{renderStatus(vacation.estado)}</td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        {vacation.estado === 'pending' ? (
                                            <>
                                                <button
                                                    onClick={() => openActionModal(vacation.id, 'reject')}
                                                    disabled={actionLoading === vacation.id}
                                                    className="px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 font-bold text-sm rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    Rechazar
                                                </button>
                                                <button
                                                    onClick={() => openActionModal(vacation.id, 'approve')}
                                                    disabled={actionLoading === vacation.id}
                                                    className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white font-bold text-sm rounded-lg shadow-sm transition-colors disabled:opacity-50"
                                                >
                                                    Aprobar
                                                </button>
                                            </>
                                        ) : vacation.estado === 'approved' ? (
                                            <button
                                                onClick={() => openActionModal(vacation.id, 'cancel')}
                                                disabled={actionLoading === vacation.id}
                                                className="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 font-bold text-xs rounded-lg transition-colors border border-amber-200 dark:border-amber-800"
                                            >
                                                Cancelar Aprobada
                                            </button>
                                        ) : (
                                            <span className="text-xs text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider">Procesada</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Controles de Paginación */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-700">
                        <span className="text-sm text-gray-500 dark:text-slate-400 font-medium">
                            Mostrando <span className="font-bold text-corporate">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedVacations.length)}</span> de <span className="font-bold text-gray-800 dark:text-white">{sortedVacations.length}</span>
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => changePage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={'px-3 py-1.5 rounded-lg text-sm font-bold border ' + (currentPage === 1 ? 'border-gray-100 dark:border-slate-700 text-gray-300 dark:text-slate-600 bg-gray-50 dark:bg-slate-800 cursor-not-allowed' : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-corporate/5 hover:text-corporate transition-all')}
                            >
                                Anterior
                            </button>
                            <div className="flex gap-1">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => changePage(i + 1)}
                                        className={'w-8 h-8 rounded-lg text-sm font-bold transition-all ' + (currentPage === i + 1 ? 'bg-corporate text-white shadow-md' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700')}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => changePage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className={'px-3 py-1.5 rounded-lg text-sm font-bold border ' + (currentPage === totalPages ? 'border-gray-100 dark:border-slate-700 text-gray-300 dark:text-slate-600 bg-gray-50 dark:bg-slate-800 cursor-not-allowed' : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-corporate/5 hover:text-corporate transition-all')}
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Acción (Aprobar/Rechazar) */}
            {actionModal.isOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-700 flex flex-col">
                        <div className={"p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center " + (actionModal.type === 'approve' ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400' : actionModal.type === 'cancel' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400')}>
                            <h3 className="text-xl font-bold">
                                {actionModal.type === 'approve' ? 'Aprobar Vacaciones' : 
                                 actionModal.type === 'reject' ? 'Rechazar Vacaciones' : 'Anular/Cancelar Solicitud'}
                            </h3>
                            <button onClick={() => setActionModal({ ...actionModal, isOpen: false })} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 transition-colors">
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <div className="p-6">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Mensaje o Razón (Opcional pero recomendado)</label>
                            <textarea
                                value={actionModal.message}
                                onChange={(e) => setActionModal({ ...actionModal, message: e.target.value })}
                                rows="4"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-corporate focus:ring-2 focus:ring-corporate/20 outline-none transition-all resize-none text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                placeholder={actionModal.type === 'approve' ? '¡Disfruta tus vacaciones!' : 'No ha sido posible debido a...'}
                            ></textarea>

                            <div className="pt-4 flex justify-end gap-3 mt-4">
                                <button type="button" onClick={() => setActionModal({ ...actionModal, isOpen: false })} className="px-5 py-2.5 rounded-xl font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmAction}
                                    className={"px-5 py-2.5 rounded-xl font-bold text-white transition-colors shadow-md " + (actionModal.type === 'approve' ? 'bg-green-500 hover:bg-green-600' : actionModal.type === 'cancel' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-red-500 hover:bg-red-600')}
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminVacations;