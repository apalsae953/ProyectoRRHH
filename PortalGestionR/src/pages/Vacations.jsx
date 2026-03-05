import { useState, useEffect } from 'react';
import vacationService from '../services/vacationService';

const Vacations = () => {
    const [vacations, setVacations] = useState([]);
    const [balance, setBalance] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Pedimos las vacaciones y el saldo al mismo tiempo
                const [vacationsRes, balanceRes] = await Promise.all([
                    vacationService.getMyVacations(),
                    vacationService.getMyBalance().catch(() => null) // Atrapamos el error por si la ruta del saldo aún no existe
                ]);

                // Extraemos los datos adaptándonos a Laravel ApiResource
                setVacations(vacationsRes.data?.data || vacationsRes.data || []);

                // Si tienes el Resource configurado, el balance vendrá aquí
                const balanceData = balanceRes?.data?.data?.[0] || balanceRes?.data || { total_days: 22, used_days: 0, available_days: 22 };
                setBalance(balanceData);

            } catch (error) {
                console.error("Error al cargar el módulo de vacaciones", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

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
                    <button className="bg-corporate hover:bg-corporate-dark text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 group">
                        <i className="fa-solid fa-plus transition-transform group-hover:rotate-90"></i>
                        <span>Nueva Solicitud</span>
                    </button>
                </div>
            </div>

            {/* Tarjetas de Resumen de Saldo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md hover:border-corporate/30 transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-corporate/5 rotate-45 translate-x-12 -translate-y-8 blur-2xl group-hover:bg-corporate/10 transition-colors"></div>
                    <div className="w-12 h-12 bg-corporate/10 text-corporate rounded-2xl flex items-center justify-center text-xl shadow-inner border border-corporate/20 shrink-0 z-10">
                        <i className="fa-regular fa-calendar"></i>
                    </div>
                    <div className="z-10">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Generados</p>
                        <p className="text-3xl font-black text-slate-800 tracking-tight">{balance?.total_days || 22} <span className="text-sm font-bold text-slate-400">días</span></p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md hover:border-amber-400/30 transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rotate-45 translate-x-12 -translate-y-8 blur-2xl group-hover:bg-amber-400/10 transition-colors"></div>
                    <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center text-xl shadow-inner border border-amber-200/50 shrink-0 z-10">
                        <i className="fa-solid fa-plane-departure"></i>
                    </div>
                    <div className="z-10">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Días Consumidos</p>
                        <p className="text-3xl font-black text-slate-800 tracking-tight">{balance?.used_days || 0} <span className="text-sm font-bold text-slate-400">días</span></p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md hover:border-emerald-500/30 transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rotate-45 translate-x-12 -translate-y-8 blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl shadow-inner border border-emerald-200/50 shrink-0 z-10">
                        <i className="fa-solid fa-umbrella-beach"></i>
                    </div>
                    <div className="z-10">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Días Disponibles</p>
                        <p className="text-3xl font-black text-emerald-600 tracking-tight">{balance?.available_days || 22} <span className="text-sm font-bold opacity-70">días</span></p>
                    </div>
                </div>
            </div>

            {/* Tabla de Historial */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-800">Historial de Solicitudes</h3>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 font-bold rounded-full text-xs border border-slate-200">
                        <i className="fa-solid fa-list-ul mr-1.5"></i>
                        {vacations.length} peticiones
                    </span>
                </div>

                <div className="overflow-x-auto p-6 md:p-8">
                    <table className="w-full text-left border-separate border-spacing-y-3">
                        <thead>
                            <tr className="text-slate-400 text-xs font-bold uppercase tracking-widest px-4">
                                <th className="px-4 pb-2 font-bold">Fecha Inicio</th>
                                <th className="px-4 pb-2 font-bold">Fecha Fin</th>
                                <th className="px-4 pb-2 font-bold text-center">Días</th>
                                <th className="px-4 pb-2 font-bold">Estado</th>
                                <th className="px-4 pb-2 font-bold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {vacations.length > 0 ? (
                                vacations.map((vacation) => (
                                    <tr key={vacation.id} className="bg-white shadow-[0_0_15px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-300 rounded-2xl group border border-slate-50">
                                        <td className="p-4 rounded-l-2xl border-t border-b border-l border-slate-100 group-hover:border-corporate/20 transition-colors font-medium text-slate-700">
                                            {vacation.start_date}
                                        </td>
                                        <td className="p-4 border-t border-b border-slate-100 group-hover:border-corporate/20 transition-colors font-medium text-slate-700">
                                            {vacation.end_date}
                                        </td>
                                        <td className="p-4 text-center border-t border-b border-slate-100 group-hover:border-corporate/20 transition-colors">
                                            <span className="font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg">
                                                {vacation.days_used}
                                            </span>
                                        </td>
                                        <td className="p-4 border-t border-b border-slate-100 group-hover:border-corporate/20 transition-colors">
                                            {renderStatus(vacation.status || 'pending')}
                                        </td>
                                        <td className="p-4 text-right rounded-r-2xl border-t border-b border-r border-slate-100 group-hover:border-corporate/20 transition-colors">
                                            {vacation.status === 'pending' ? (
                                                <button className="text-red-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 font-bold px-3 py-2 rounded-xl transition-all shadow-sm">
                                                    Cancelar
                                                </button>
                                            ) : (
                                                <span className="text-slate-300 text-xs font-medium italic select-none">Sin acciones</span>
                                            )}
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
            </div>

        </div>
    );
};

export default Vacations;