import { useState, useEffect } from 'react';
import employeeService from '../services/employeeService';

const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    // Paginación y Ordenamiento
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const response = await employeeService.getEmployees();
                // getEmployees ya devuelve la directamenta la data de axios (response.data)
                const employeeList = response?.data || response || [];
                setEmployees(Array.isArray(employeeList) ? employeeList : []);
            } catch (error) {
                console.error("Error al cargar empleados", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEmployees();
    }, []);

    // Función para manejar el clic en las cabeceras de la tabla
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Ordenar los empleados
    const sortedEmployees = [...employees].sort((a, b) => {
        if (!sortConfig.key) return 0;

        let aValue = a[sortConfig.key] || '';
        let bValue = b[sortConfig.key] || '';

        // Casos especiales (unir nombre y apellido para ordenar)
        if (sortConfig.key === 'nombre') {
            aValue = (a.nombre + ' ' + a.apellidos).toLowerCase();
            bValue = (b.nombre + ' ' + b.apellidos).toLowerCase();
        } else if (sortConfig.key === 'estado') {
            // Actualmente todos dicen 'Activo', pero sirve para el futuro
            aValue = a.status || 'active';
            bValue = b.status || 'active';
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    // Paginación: Extracción del segmento a renderizar
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentEmployees = sortedEmployees.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(employees.length / itemsPerPage);

    const changePage = (pageNumber) => setCurrentPage(pageNumber);

    if (loading) return (
        <div className="flex justify-center items-center h-48">
            <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-corporate-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="font-bold text-gray-500 text-lg">Cargando directorio...</span>
        </div>
    );

    return (
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden mb-10">
            <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 bg-slate-50/50">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Directorio de Empleados</h2>
                    <p className="text-slate-500 text-sm mt-1 font-medium">Gestiona tu equipo y consulta información de contacto.</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="px-4 py-2 bg-corporate/10 text-corporate font-bold rounded-xl text-sm border border-corporate/20 shadow-sm flex items-center gap-2">
                        <i className="fa-solid fa-users text-base"></i>
                        {employees.length} trabajadores
                    </span>
                    <button className="bg-corporate hover:bg-corporate-dark text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                        <i className="fa-solid fa-plus text-base"></i>
                        Añadir
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto p-6 md:p-8">
                <table className="w-full text-left border-separate border-spacing-y-3">
                    <thead>
                        <tr className="text-slate-400 text-xs font-bold uppercase tracking-widest px-4">
                            <th className="px-4 pb-2 font-bold text-left cursor-pointer hover:text-corporate transition-colors group" onClick={() => handleSort('nombre')}>
                                <div className="flex items-center gap-2">
                                    <span>Empleado</span>
                                    <i className={'fa-solid ' + (sortConfig.key === 'nombre' ? (sortConfig.direction === 'asc' ? 'fa-sort-up text-corporate' : 'fa-sort-down text-corporate') : 'fa-sort opacity-20 group-hover:opacity-50') + ' text-xs mt-1 transition-opacity'}></i>
                                </div>
                            </th>
                            <th className="px-4 pb-2 font-bold hidden md:table-cell text-left">DNI</th>
                            <th className="px-4 pb-2 font-bold hidden sm:table-cell text-left cursor-pointer hover:text-corporate transition-colors group" onClick={() => handleSort('puesto')}>
                                <div className="flex items-center gap-2">
                                    <span>Puesto</span>
                                    <i className={'fa-solid ' + (sortConfig.key === 'puesto' ? (sortConfig.direction === 'asc' ? 'fa-sort-up text-corporate' : 'fa-sort-down text-corporate') : 'fa-sort opacity-20 group-hover:opacity-50') + ' text-xs mt-1 transition-opacity'}></i>
                                </div>
                            </th>
                            <th className="px-4 pb-2 font-bold text-center cursor-pointer hover:text-corporate transition-colors group" onClick={() => handleSort('estado')}>
                                <div className="flex items-center justify-center gap-2">
                                    <span>Estado</span>
                                    <i className={'fa-solid ' + (sortConfig.key === 'estado' ? (sortConfig.direction === 'asc' ? 'fa-sort-up text-corporate' : 'fa-sort-down text-corporate') : 'fa-sort opacity-20 group-hover:opacity-50') + ' text-xs mt-1 transition-opacity'}></i>
                                </div>
                            </th>
                            <th className="px-4 pb-2 font-bold text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {currentEmployees.map((emp) => (
                            <tr key={emp.id} className="bg-white shadow-[0_0_15px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-300 rounded-2xl group border border-slate-50">
                                <td className="p-4 rounded-l-2xl border-t border-b border-l border-slate-100 group-hover:border-corporate/20 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-corporate/10 text-corporate font-bold flex items-center justify-center shrink-0 border border-corporate/20">
                                            {emp.nombre.charAt(0)}{emp.apellidos.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-base">{emp.nombre} {emp.apellidos}</p>
                                            <p className="text-xs font-medium text-slate-500 mt-0.5">{emp.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 font-mono font-medium text-slate-600 hidden md:table-cell border-t border-b border-slate-100 group-hover:border-corporate/20 transition-colors">
                                    {emp.dni}
                                </td>
                                <td className="p-4 font-medium text-slate-600 hidden sm:table-cell border-t border-b border-slate-100 group-hover:border-corporate/20 transition-colors">
                                    {emp.puesto || 'No asignado'}
                                </td>
                                <td className="p-4 text-center border-t border-b border-slate-100 group-hover:border-corporate/20 transition-colors">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                        Activo
                                    </div>
                                </td>
                                <td className="p-4 text-right rounded-r-2xl border-t border-b border-r border-slate-100 group-hover:border-corporate/20 transition-colors">
                                    <button className="text-slate-400 hover:text-corporate bg-slate-50 hover:bg-corporate/10 font-bold px-3 py-2.5 rounded-xl transition-all inline-flex items-center gap-2 group-hover:shadow-sm">
                                        <span className="text-xs hidden lg:block">Ver Perfil</span>
                                        <i className="fa-solid fa-arrow-right"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Controles de Paginación */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 px-2">
                        <span className="text-sm text-slate-500 font-medium">
                            Mostrando <span className="font-bold text-corporate">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, employees.length)}</span> de <span className="font-bold text-slate-800">{employees.length}</span>
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => changePage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={'px-3 py-1.5 rounded-lg text-sm font-bold border ' + (currentPage === 1 ? 'border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed' : 'border-slate-200 text-slate-600 bg-white hover:bg-corporate/5 hover:border-corporate/20 hover:text-corporate transition-all shadow-sm')}
                            >
                                Anterior
                            </button>

                            <div className="flex items-center gap-1 hidden sm:flex">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => changePage(i + 1)}
                                        className={'w-8 h-8 rounded-lg text-sm font-bold transition-all flex items-center justify-center ' + (currentPage === i + 1 ? 'bg-corporate text-white shadow-md' : 'text-slate-500 hover:bg-corporate/10 hover:text-corporate border border-transparent hover:border-corporate/20')}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => changePage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className={'px-3 py-1.5 rounded-lg text-sm font-bold border ' + (currentPage === totalPages ? 'border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed' : 'border-slate-200 text-slate-600 bg-white hover:bg-corporate/5 hover:border-corporate/20 hover:text-corporate transition-all shadow-sm')}
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Employees;