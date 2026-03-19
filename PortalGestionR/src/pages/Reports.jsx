import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';

const Reports = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('reports'); // 'reports' or 'logs'
    const [reportData, setReportData] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Estados para Auditoría (Logs)
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortDir, setSortDir] = useState('desc');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, last_page: 1 });

    const isAdmin = user?.roles?.some(r => typeof r === 'string' ? r === 'admin' : r.name === 'admin');

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line
    }, [activeTab, page, sortBy, sortDir]);

    // Recargar al buscar (con pequeño delay para no saturar)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (activeTab === 'logs') {
                setPage(1);
                fetchData();
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'reports') {
                const response = await axios.get('/api/v1/reports/dashboard');
                setReportData(response.data);
            } else if (activeTab === 'logs' && isAdmin) {
                const response = await axios.get('/api/v1/logs', {
                    params: {
                        search,
                        sort_by: sortBy,
                        sort_dir: sortDir,
                        page,
                        per_page: 10
                    }
                });
                setLogs(response.data.data || []);
                setPagination({
                    total: response.data.total,
                    last_page: response.data.last_page
                });
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const translateKey = (key) => {
        const translations = {
            'name': 'Nombre',
            'surname': 'Apellidos',
            'email': 'Email',
            'dni': 'DNI',
            'phone': 'Teléfono',
            'address': 'Dirección',
            'status': 'Estado',
            'hired_at': 'Fecha Alta',
            'start_date': 'Desde',
            'end_date': 'Hasta',
            'days': 'Días',
            'type': 'Tipo',
            'note': 'Nota / Observaciones',
            'cancel_reason': 'Mto. Cancelación',
            'admin_message': 'Msg. Administración',
            'position_id': 'ID Puesto',
            'department_id': 'ID Dept.',
            'accrued_days': 'Días Totales',
            'taken_days': 'Días Usados',
            'carried_over_days': 'Días Arrastrados',
            'period_year': 'Año Período',
            'period_month': 'Mes Período',
            'title': 'Título Doc.',
            'two_factor_secret': 'Doble Factor (2FA)',
            'photo': 'Foto Perfil',
            'visibility': 'Visibilidad',
        };
        return translations[key] || key;
    };

    const getLogSummary = (log) => {
        const type = log.subject_type?.split('\\').pop();
        const event = log.event;
        const attrs = log.properties?.attributes || {};
        const old = log.properties?.old || {};

        if (type === 'User') {
            if (event === 'created') return 'Nuevo empleado registrado';
            if (attrs.photo) return 'Cambio de foto de perfil';
            if (attrs.password) return 'Cambio de contraseña';
            if (attrs.status === 'inactive') return 'Empleado desactivado / Baja';
            if (attrs.status === 'active' && old.status === 'inactive') return 'Empleado reactivado';
            if (attrs.two_factor_secret === null && old.two_factor_secret) return 'Doble factor (2FA) desactivado';
            return 'Actualización de datos del empleado';
        }

        if (type === 'Vacation') {
            if (event === 'created') return 'Nueva solicitud de vacaciones';
            if (attrs.status === 'approved') return 'Aprobación de vacaciones';
            if (attrs.status === 'rejected') return 'Rechazo de vacaciones';
            if (attrs.status === 'canceled') return 'Cancelación de vacaciones';
            return 'Modificación en solicitud de vacaciones';
        }

        if (type === 'Document') {
            if (event === 'created') {
                const docType = attrs.type === 'payroll' ? 'Nómina' : attrs.type === 'contract' ? 'Contrato' : 'Documento';
                return `Envío de ${docType.toLowerCase()}`;
            }
            if (event === 'deleted') return 'Documento eliminado';
            return 'Documento modificado';
        }

        if (type === 'HolidayDate') {
            if (event === 'created') return 'Añadido festivo al calendario';
            if (event === 'deleted') return 'Festivo eliminado del calendario';
            return 'Cambio en el calendario laboral';
        }

        if (type === 'VacationBalance') return 'Ajuste de días de vacaciones';
        if (type === 'Setting') return 'Cambio en la configuración del sistema';

        return log.description || `Acción en ${type}`;
    };

    const handleSort = (col) => {
        if (sortBy === col) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(col);
            setSortDir('desc');
        }
        setPage(1);
    };

    const formatLogValue = (key, value) => {
        if (value === null) return 'Vacío';
        if (typeof value === 'boolean') return value ? 'Sí' : 'No';
        // Si parece una fecha ISO (contiene T y acaba en Z)
        if (typeof value === 'string' && value.includes('T') && value.endsWith('Z')) {
            return new Date(value).toLocaleDateString('es-ES');
        }
        if (key === 'status') {
            const states = { 'active': 'Activo', 'inactive': 'Inactivo', 'pending': 'Pendiente', 'approved': 'Aprobado', 'rejected': 'Rechazado', 'canceled': 'Cancelado' };
            return states[value] || value;
        }
        if (key === 'type') {
            const types = { 'payroll': 'Nómina', 'contract': 'Contrato', 'certificate': 'Certificado', 'other': 'Otro', 'vacation': 'Vacaciones', 'sick_leave': 'Baja Médica' };
            return types[value] || value;
        }
        return String(value);
    };

    if (!user?.roles?.some(r => typeof r === 'string' ? ['admin', 'hr_director'].includes(r) : ['admin', 'hr_director'].includes(r.name))) {
        return <div className="p-8 text-center text-red-500 font-bold">Acceso Denegado</div>;
    }

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Cabecera */}
            <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden mb-6">
                <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Reportes y Auditoría</h2>
                        <p className="text-slate-500 text-sm mt-1 font-medium">Panel de control con métricas globales y registro de actividad.</p>
                    </div>
                    <div className="flex bg-slate-200/50 p-1.5 rounded-2xl">
                        <button
                            onClick={() => setActiveTab('reports')}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'reports' ? 'bg-white text-corporate shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <i className="fa-solid fa-chart-pie mr-2"></i> Reportes
                        </button>
                        {isAdmin && (
                            <button
                                onClick={() => setActiveTab('logs')}
                                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'logs' ? 'bg-white text-corporate shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <i className="fa-solid fa-clipboard-list mr-2"></i> Auditoría (Logs)
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-20">
                    <i className="fa-solid fa-circle-notch fa-spin text-4xl text-corporate"></i>
                </div>
            ) : (
                <>
                    {/* VISTA DE REPORTES */}
                    {activeTab === 'reports' && reportData && (
                        <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

                            {/* Card de Empleados */}
                            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><i className="fa-solid fa-users text-xl"></i></div>
                                    <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold text-[10px] rounded-full">Empleados</span>
                                </div>
                                <h4 className="text-2xl font-black text-slate-800">{reportData.employees.total}</h4>
                                <p className="text-[11px] text-slate-500 font-medium mt-1">Activos: <span className="text-emerald-500 font-bold">{reportData.employees.active}</span></p>
                            </div>

                            {/* Card de Documentos */}
                            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><i className="fa-solid fa-file-invoice text-xl"></i></div>
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full">Documentos</span>
                                </div>
                                <h4 className="text-2xl font-black text-slate-800">{reportData.documents.total}</h4>
                                <p className="text-[11px] text-slate-500 font-medium mt-1">Nóminas: <span className="text-slate-700 font-bold">{reportData.documents.by_type.payroll}</span></p>
                            </div>

                            {/* Card de Vacaciones */}
                            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><i className="fa-solid fa-plane-departure text-xl"></i></div>
                                    <span className="px-3 py-1 bg-amber-50 text-amber-700 font-bold text-[10px] rounded-full">Vacaciones</span>
                                </div>
                                <h4 className="text-2xl font-black text-slate-800">{reportData.vacations.approved}</h4>
                                <p className="text-[11px] text-slate-500 font-medium mt-1">Pendientes: <span className="text-amber-500 font-bold">{reportData.vacations.pending}</span></p>
                            </div>

                            {/* Card de Horas Extra */}
                            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl"><i className="fa-solid fa-clock-rotate-left text-xl"></i></div>
                                    <span className="px-3 py-1 bg-orange-50 text-orange-700 font-bold text-[10px] rounded-full">Horas Extra</span>
                                </div>
                                <h4 className="text-2xl font-black text-slate-800">{reportData.overtime?.total_approved || 0}</h4>
                                <div className="space-y-0.5 mt-1">
                                    <p className="text-[11px] text-slate-500 font-medium">Horas totales: <span className="text-emerald-600 font-bold">{reportData.overtime?.total_hours || 0}h</span></p>
                                    <p className="text-[11px] text-slate-500 font-medium">Pendientes: <span className="text-orange-600 font-bold">{reportData.overtime?.pending || 0}</span></p>
                                </div>
                            </div>

                            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><i className="fa-solid fa-user-plus text-xl"></i></div>
                                    <span className="px-3 py-1 bg-purple-50 text-purple-700 font-bold text-[10px] rounded-full">Nuevos Emp.</span>
                                </div>
                                <h4 className="text-2xl font-black text-slate-800">{reportData.employees.recent_hires_6m}</h4>
                                <p className="text-[11px] text-slate-500 font-medium mt-1">Últimos 6 meses</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                            {/* SECCIÓN DOCUMENTOS POR TIPO */}
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8">
                                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <i className="fa-solid fa-chart-bar text-corporate"></i> Desglose de Documentos
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold"><i className="fa-solid fa-money-check-dollar"></i></div>
                                            <span className="font-bold text-slate-700">Nóminas</span>
                                        </div>
                                        <span className="font-black text-xl text-slate-800">{reportData.documents.by_type.payroll}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center font-bold"><i className="fa-solid fa-file-signature"></i></div>
                                            <span className="font-bold text-slate-700">Contratos</span>
                                        </div>
                                        <span className="font-black text-xl text-slate-800">{reportData.documents.by_type.contract}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center font-bold"><i className="fa-solid fa-certificate"></i></div>
                                            <span className="font-bold text-slate-700">Certificados</span>
                                        </div>
                                        <span className="font-black text-xl text-slate-800">{reportData.documents.by_type.certificate}</span>
                                    </div>
                                </div>
                            </div>

                            {/* SECCIÓN ESTADO VACACIONES */}
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8">
                                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <i className="fa-solid fa-calendar-check text-corporate"></i> Solicitudes Vacacionales ({new Date().getFullYear()})
                                </h3>
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 text-center">
                                        <span className="block text-amber-600 text-xs font-bold uppercase tracking-wider mb-2">Pendientes</span>
                                        <span className="text-4xl font-black text-amber-700">{reportData.vacations.pending}</span>
                                    </div>
                                    <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                                        <span className="block text-emerald-600 text-xs font-bold uppercase tracking-wider mb-2">Aprobadas</span>
                                        <span className="text-4xl font-black text-emerald-700">{reportData.vacations.approved}</span>
                                    </div>
                                </div>

                                {/* Mini Gráfico de Barras CSS */}
                                <h4 className="text-sm font-bold text-slate-600 mb-4 uppercase tracking-widest">Días Disfrutados por Mes</h4>
                                <div className="flex items-end justify-between gap-1 h-32 bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                                    {Object.entries(reportData.vacations.approved_days_by_month).map(([month, days]) => {
                                        const maxDays = Math.max(...Object.values(reportData.vacations.approved_days_by_month), 1);
                                        const height = (days / maxDays) * 100;
                                        const monthNames = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                                        return (
                                            <div key={month} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                                <div
                                                    className="w-full max-w-[12px] bg-corporate rounded-t-full transition-all duration-500 group-hover:bg-corporate-dark relative"
                                                    style={{ height: `${height}%` }}
                                                >
                                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-bold">
                                                        {days} días
                                                    </div>
                                                </div>
                                                <span className="text-[9px] font-bold text-slate-400 mt-2 uppercase">{monthNames[month]}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        </>
                    )}

                    {/* VISTA DE AUDITORÍA LOGS */}
                    {activeTab === 'logs' && isAdmin && (
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <i className="fa-solid fa-clipboard-check text-corporate"></i> Registro de Actividades
                                </h3>
                                <div className="relative w-full md:w-72">
                                    <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                                    <input 
                                        type="text" 
                                        placeholder="Buscar por usuario, acción..." 
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-corporate/20 focus:border-corporate transition-all outline-none"
                                    />
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider font-extrabold text-slate-500">
                                            <th className="p-4 pl-6 cursor-pointer hover:text-corporate transition-colors" onClick={() => handleSort('created_at')}>
                                                Fecha y Hora {sortBy === 'created_at' && <i className={`fa-solid fa-sort-${sortDir === 'asc' ? 'up' : 'down'} ml-1`}></i>}
                                            </th>
                                            <th className="p-4">Usuario Responsable</th>
                                            <th className="p-4">Acción</th>
                                            <th className="p-4">Registro Afectado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {logs.map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="p-4 pl-6 text-sm text-slate-500 font-medium whitespace-nowrap">
                                                    {new Date(log.created_at).toLocaleString('es-ES')}
                                                </td>
                                                <td className="p-4">
                                                    {log.causer ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold font-mono">
                                                                {log.causer.name?.charAt(0)}{log.causer.surname?.charAt(0)}
                                                            </div>
                                                            <span className="text-sm font-bold text-slate-700">{log.causer.name} {log.causer.surname}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-slate-400 italic">Sistema</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-800">
                                                            {getLogSummary(log)}
                                                        </span>
                                                        <span className={`text-[10px] uppercase font-black mt-1 px-1.5 py-0.5 rounded w-fit ${
                                                            log.event === 'created' ? 'bg-emerald-100 text-emerald-700' :
                                                            log.event === 'updated' ? 'bg-blue-100 text-blue-700' :
                                                            log.event === 'deleted' ? 'bg-red-100 text-red-700' :
                                                            'bg-slate-100 text-slate-500'
                                                        }`}>
                                                            {log.event === 'created' ? 'Alta' :
                                                             log.event === 'updated' ? 'Edición' :
                                                             log.event === 'deleted' ? 'Borrado' :
                                                             log.event}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-sm mb-1 flex items-center gap-2">
                                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs font-bold border border-slate-200">
                                                            {log.subject_type?.split('\\').pop() === 'User' ? 'Empleado' : 
                                                             log.subject_type?.split('\\').pop() === 'Vacation' ? 'Vacaciones' :
                                                             log.subject_type?.split('\\').pop() === 'HolidayDate' ? 'Festivo' :
                                                             log.subject_type?.split('\\').pop() || 'Registro'}
                                                        </span>
                                                        <div className="flex flex-col">
                                                            {log.subject_name && <span className="text-xs font-bold text-slate-700">{log.subject_name}</span>}
                                                            {log.subject_id && <span className="text-slate-400 font-mono text-[10px]">ID: {log.subject_id}</span>}
                                                        </div>
                                                    </div>
                                                    {log.properties && (log.properties.attributes || log.properties.old) && (
                                                        <div className="mt-3 space-y-1.5 border-l-2 border-slate-100 pl-4 py-1">
                                                            {log.event === 'updated' && log.properties.old ? (
                                                                // Vista de cambios: Antes -> Después
                                                                Object.entries(log.properties.attributes || {})
                                                                    .filter(([key]) => key !== 'dni' && key !== 'password' && key !== 'remember_token' && key !== 'dni_normalizado' && key !== 'two_factor_secret' && key !== 'updated_at')
                                                                    .map(([key, value]) => (
                                                                        <div key={key} className="text-[11px] leading-relaxed">
                                                                            <span className="font-bold text-slate-600">{translateKey(key)}:</span>
                                                                            <span className="text-red-400 mx-1.5 line-through decoration-red-200/50">{formatLogValue(key, log.properties.old[key])}</span>
                                                                            <i className="fa-solid fa-arrow-right text-[9px] text-slate-300 mx-1"></i>
                                                                            <span className="text-emerald-600 font-bold ml-1.5 bg-emerald-50 px-1.5 py-0.5 rounded">{formatLogValue(key, value)}</span>
                                                                        </div>
                                                                    ))
                                                            ) : (
                                                                // Vista simple de valores (Creación o sin histórico)
                                                                Object.entries(log.properties.attributes || log.properties.old || {})
                                                                    .filter(([key]) => key !== 'dni' && key !== 'password' && key !== 'remember_token' && key !== 'dni_normalizado' && key !== 'two_factor_secret' && key !== 'updated_at')
                                                                    .map(([key, value]) => (
                                                                        <div key={key} className="text-[11px] flex items-center gap-2">
                                                                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                                            <span className="font-bold text-slate-500">{translateKey(key)}:</span>
                                                                            <span className="text-slate-700 font-medium">{formatLogValue(key, value)}</span>
                                                                        </div>
                                                                    ))
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {logs.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="p-10 text-center text-slate-500 font-medium">
                                                    No hay registros de actividad recientes.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Paginación */}
                            {pagination.last_page > 1 && (
                                <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center">
                                    <p className="text-xs font-bold text-slate-500">
                                        Total: <span className="text-slate-800">{pagination.total}</span> registros
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            disabled={page === 1}
                                            onClick={() => setPage(page - 1)}
                                            className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-white hover:text-corporate disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                        >
                                            <i className="fa-solid fa-chevron-left text-xs"></i>
                                        </button>
                                        <span className="text-xs font-bold text-slate-600 px-4">
                                            Página {page} de {pagination.last_page}
                                        </span>
                                        <button 
                                            disabled={page === pagination.last_page}
                                            onClick={() => setPage(page + 1)}
                                            className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-white hover:text-corporate disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                        >
                                            <i className="fa-solid fa-chevron-right text-xs"></i>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Reports;
