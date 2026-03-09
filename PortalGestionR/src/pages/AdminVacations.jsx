import { useState, useEffect } from 'react';
import vacationService from '../services/vacationService';

const AdminVacations = () => {
    const [vacations, setVacations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // Para saber qué botón está cargando
    const [actionModal, setActionModal] = useState({ isOpen: false, id: null, type: null, message: '' });

    // Paginación y Ordenamiento
    const [currentPage, setCurrentPage] = useState(1);
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
            } else {
                await vacationService.rejectVacation(id, message);
            }
            await fetchAllVacations();
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

    const sortedVacations = [...vacations].sort((a, b) => {
        let aValue, bValue;

        if (sortKey === 'empleado') {
            aValue = a.empleado?.nombre?.toLowerCase() || '';
            bValue = b.empleado?.nombre?.toLowerCase() || '';
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
    const totalPages = Math.ceil(sortedVacations.length / itemsPerPage);

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
            canceled: 'bg-gray-100 text-gray-700 border-gray-200',
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
        <div className="flex justify-center items-center h-48">
            <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-corporate-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="font-bold text-gray-500 text-lg">Cargando panel de gestión...</span>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Gestión de Vacaciones</h2>
                <p className="text-sm text-gray-500 font-medium">Aprueba o rechaza las solicitudes de los empleados</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800">Bandeja de Entrada</h3>
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                        {vacations.filter(v => v.estado === 'pending').length} Pendientes
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
                                <th className="p-4 font-bold cursor-pointer hover:text-corporate transition-colors" onClick={() => handleSort('empleado')}>
                                    Empleado {sortKey === 'empleado' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="p-4 font-bold cursor-pointer hover:text-corporate transition-colors" onClick={() => handleSort('fecha_inicio')}>
                                    Fechas {sortKey === 'fecha_inicio' && (sortDirection === 'asc' ? '↑' : '↓')}
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
                        <tbody className="divide-y divide-gray-50">
                            {currentItems.map((vacation) => (
                                <tr key={vacation.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4">
                                        <p className="font-bold text-gray-900">{vacation.empleado?.nombre || ('Aspirante')}</p>
                                        {vacation.nota && (
                                            <p className="text-xs text-slate-500 italic mt-1 font-medium bg-slate-100 p-2 rounded-lg break-words">
                                                <i className="fa-solid fa-quote-left mr-1 opacity-50"></i>
                                                {vacation.nota}
                                            </p>
                                        )}
                                        {vacation.mensaje_admin && (
                                            <p className={"text-xs italic mt-1 font-medium p-2 rounded-lg break-words " + (vacation.estado === 'approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
                                                <i className="fa-solid fa-reply mr-1 opacity-50"></i>
                                                {vacation.mensaje_admin}
                                            </p>
                                        )}
                                    </td>
                                    <td className="p-4 text-sm font-semibold text-gray-600">
                                        {vacation.fecha_inicio} <span className="text-gray-400 font-normal">al</span> {vacation.fecha_fin}
                                    </td>
                                    <td className="p-4 text-center font-bold text-corporate">{vacation.dias_solicitados || '-'}</td>
                                    <td className="p-4">{renderStatus(vacation.estado)}</td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        {vacation.estado === 'pending' ? (
                                            <>
                                                <button
                                                    onClick={() => openActionModal(vacation.id, 'reject')}
                                                    disabled={actionLoading === vacation.id}
                                                    className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-bold text-sm rounded-lg transition-colors disabled:opacity-50"
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
                                        ) : (
                                            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Procesada</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Controles de Paginación */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 bg-gray-50/50 border-t border-gray-100">
                        <span className="text-sm text-gray-500 font-medium">
                            Mostrando <span className="font-bold text-corporate">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedVacations.length)}</span> de <span className="font-bold text-gray-800">{sortedVacations.length}</span>
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => changePage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={'px-3 py-1.5 rounded-lg text-sm font-bold border ' + (currentPage === 1 ? 'border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed' : 'border-gray-200 text-gray-600 bg-white hover:bg-corporate/5 hover:text-corporate transition-all')}
                            >
                                Anterior
                            </button>
                            <div className="flex gap-1">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => changePage(i + 1)}
                                        className={'w-8 h-8 rounded-lg text-sm font-bold transition-all ' + (currentPage === i + 1 ? 'bg-corporate text-white shadow-md' : 'text-gray-500 hover:bg-gray-100')}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => changePage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className={'px-3 py-1.5 rounded-lg text-sm font-bold border ' + (currentPage === totalPages ? 'border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed' : 'border-gray-200 text-gray-600 bg-white hover:bg-corporate/5 hover:text-corporate transition-all')}
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Acción (Aprobar/Rechazar) */}
            {actionModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col">
                        <div className={"p-6 border-b border-slate-100 flex justify-between items-center " + (actionModal.type === 'approve' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800')}>
                            <h3 className="text-xl font-bold">
                                {actionModal.type === 'approve' ? 'Aprobar Vacaciones' : 'Rechazar Vacaciones'}
                            </h3>
                            <button onClick={() => setActionModal({ ...actionModal, isOpen: false })} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/50 text-slate-500 hover:bg-white transition-colors">
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <div className="p-6">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Mensaje o Razón (Opcional pero recomendado)</label>
                            <textarea
                                value={actionModal.message}
                                onChange={(e) => setActionModal({ ...actionModal, message: e.target.value })}
                                rows="4"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-corporate focus:ring-2 focus:ring-corporate/20 outline-none transition-all resize-none"
                                placeholder={actionModal.type === 'approve' ? '¡Disfruta tus vacaciones!' : 'No ha sido posible debido a...'}
                            ></textarea>

                            <div className="pt-4 flex justify-end gap-3 mt-4">
                                <button type="button" onClick={() => setActionModal({ ...actionModal, isOpen: false })} className="px-5 py-2.5 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmAction}
                                    className={"px-5 py-2.5 rounded-xl font-bold text-white transition-colors shadow-md " + (actionModal.type === 'approve' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600')}
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