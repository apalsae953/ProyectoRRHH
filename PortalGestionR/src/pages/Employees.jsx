import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from '../api/axios';
import { maskDni } from '../utils/formatters';

import employeeService from '../services/employeeService';
import documentService from '../services/documentService';
import { useAuth } from '../context/AuthContext';
import ModalPortal from '../components/ModalPortal';
import { motion, AnimatePresence } from 'framer-motion';

const Employees = () => {
    const { user } = useAuth();
    const location = useLocation();
    // ¿Es admin o de recursos humanos?
    const isHrOrAdmin = user?.roles?.some(r => r && (r === 'admin' || r === 'hr_director' || r.name === 'admin' || r.name === 'hr_director'));
    // ¿Es estrictamente admin?
    const isStrictAdmin = user?.roles?.some(r => r && (r === 'admin' || r.name === 'admin'));

    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state for adding employee
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newEmployee, setNewEmployee] = useState({
        name: '', surname: '', email: '', dni: '', phone: '', address: '', position_id: '', department_id: '', roles: 'employee', hired_at: '', probation_until: ''
    });
    const [departments, setDepartments] = useState([]);
    const [positions, setPositions] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [globalSettings, setGlobalSettings] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Documentos del empleado
    const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
    const [selectedEmployeeForDocs, setSelectedEmployeeForDocs] = useState(null);
    const [employeeDocs, setEmployeeDocs] = useState([]);
    const [docsLoading, setDocsLoading] = useState(false);
    const [newDoc, setNewDoc] = useState({ file: null, type: 'payroll', title: '', period_year: new Date().getFullYear(), period_month: new Date().getMonth() + 1 });
    const [isUploadingDoc, setIsUploadingDoc] = useState(false);
    const [editingDocTitleId, setEditingDocTitleId] = useState(null);
    const [tempDocTitle, setTempDocTitle] = useState('');

    const itemsPerPage = 10;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await employeeService.getEmployees();
                const employeeList = response?.data || response || [];
                setEmployees(Array.isArray(employeeList) ? employeeList : []);

                if (isHrOrAdmin) {
                    const [deptRes, posRes, settingsRes] = await Promise.all([
                        axios.get('/api/v1/departments'),
                        axios.get('/api/v1/positions'),
                        axios.get('/api/v1/settings')
                    ]);
                    setDepartments(deptRes.data);
                    setPositions(posRes.data);
                    setGlobalSettings(settingsRes.data);
                }
            } catch (error) {
                console.error("Error al cargar datos", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Escuchar cambios en la URL para búsqueda externa (desde Ctrl+K)
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const search = queryParams.get('search');
        if (search) {
            setSearchTerm(search);
            setCurrentPage(1);
        }
    }, [location.search]);

    const handleAddEmployee = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormError('');
        try {
            // Aseguramos que el rol vaya como un array tal y como pide Laravel
            const payload = {
                ...newEmployee,
                roles: [newEmployee.roles]
            };

            await employeeService.createEmployee(payload);
            setIsAddModalOpen(false);
            setNewEmployee({ name: '', surname: '', email: '', dni: '', phone: '', address: '', position_id: '', department_id: '', roles: 'employee', hired_at: '', probation_until: '' });

            // Recargar empleados
            setLoading(true);
            const response = await employeeService.getEmployees();
            const employeeList = response?.data || response || [];
            setEmployees(Array.isArray(employeeList) ? employeeList : []);
        } catch (error) {
            setFormError(error.response?.data?.message || 'Error al crear empleado');
        } finally {
            setIsSubmitting(false);
            setLoading(false);
        }
    };

    const handleEditClick = (emp) => {
        setEditingEmployee({
            id: emp.id,
            name: emp.nombre,
            surname: emp.apellidos,
            email: emp.email,
            dni: emp.dni || '',
            phone: emp.telefono || '',
            address: emp.direccion || '',
            position_id: emp.puesto?.id || '',
            department_id: emp.departamento?.id || '',
            status: emp.estado || 'active',
            hired_at: emp.fecha_contratacion || '',
            probation_until: emp.fecha_fin_prueba || '',
            roles: Array.isArray(emp.roles) ? emp.roles : []
        });
        setIsEditModalOpen(true);
    };

    const handleDocsClick = async (emp) => {
        setSelectedEmployeeForDocs(emp);
        setIsDocsModalOpen(true);
        fetchEmployeeDocs(emp.id);
    };

    const fetchEmployeeDocs = async (empId) => {
        setDocsLoading(true);
        try {
            const response = await documentService.getEmployeeDocuments(empId);
            setEmployeeDocs(response.data?.data || []);
        } catch (error) {
            console.error("Error cargando documentos", error);
        } finally {
            setDocsLoading(false);
        }
    };

    const handleUpdateDocTitle = async (docId) => {
        try {
            await documentService.updateDocument(docId, { title: tempDocTitle });
            setEditingDocTitleId(null);
            fetchEmployeeDocs(selectedEmployeeForDocs.id);
        } catch (error) {
            alert("Error al actualizar el título");
        }
    };

    const handleUploadDoc = async (e) => {
        e.preventDefault();
        if (!newDoc.file) return alert("Selecciona un archivo primero");
        setIsUploadingDoc(true);
        try {
            const formData = new FormData();
            formData.append('file', newDoc.file);
            formData.append('type', newDoc.type);
            formData.append('title', newDoc.title || newDoc.file.name);
            formData.append('period_year', newDoc.period_year);
            formData.append('period_month', newDoc.period_month);
            formData.append('visibility', 'owner');

            await documentService.uploadDocument(selectedEmployeeForDocs.id, formData);
            setNewDoc({ file: null, type: 'payroll', title: '', period_year: new Date().getFullYear(), period_month: new Date().getMonth() + 1 });
            fetchEmployeeDocs(selectedEmployeeForDocs.id);
        } catch (error) {
            alert("Error al subir el documento");
        } finally {
            setIsUploadingDoc(false);
        }
    };

    const handleDeleteDoc = async (id) => {
        if (!window.confirm("¿Eliminar este documento?")) return;
        try {
            await documentService.deleteDocument(id);
            fetchEmployeeDocs(selectedEmployeeForDocs.id);
        } catch (error) {
            alert("Error al eliminar");
        }
    };

    const handleReset2FA = async (employee) => {
        if (!window.confirm(`¿Estás seguro de que deseas desactivar el 2FA de ${employee.nombre}?`)) return;
        try {
            await axios.post(`/api/v1/employees/${employee.id}/reset-2fa`);
            alert('Doble factor desactivado correctamente.');
            fetchEmployees();
        } catch (error) {
            alert('Error al resetear 2FA.');
        }
    };

    const handleUpdateEmployee = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormError('');
        try {
            await employeeService.updateEmployee(editingEmployee.id, editingEmployee);
            setIsEditModalOpen(false);
            setEditingEmployee(null);

            // Recargar empleados
            const response = await employeeService.getEmployees();
            const employeeList = response?.data || response || [];
            setEmployees(Array.isArray(employeeList) ? employeeList : []);
            alert('Empleado actualizado correctamente');
        } catch (error) {
            setFormError(error.response?.data?.message || 'Error al actualizar empleado');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Función para manejar el clic en las cabeceras de la tabla
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Helper func for roles
    const formatRole = (roles) => {
        if (!roles || roles.length === 0) return 'Empleado';
        if (roles.includes('admin')) return 'Administrador';
        if (roles.includes('hr_director')) return 'RRHH';
        return 'Empleado';
    };

    // Filtrar los empleados por búsqueda
    const filteredEmployees = employees.filter(emp => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        const fullName = `${emp.nombre || ''} ${emp.apellidos || ''}`.toLowerCase();
        const puestoNombre = emp.puesto?.nombre || 'Sin puesto';
        const deptoNombre = emp.departamento?.nombre || 'Sin departamento';

        return (
            fullName.includes(searchLower) ||
            (emp.email && emp.email.toLowerCase().includes(searchLower)) ||
            (emp.dni && emp.dni.toLowerCase().includes(searchLower)) ||
            puestoNombre.toLowerCase().includes(searchLower) ||
            deptoNombre.toLowerCase().includes(searchLower)
        );
    });

    // Ordenar los empleados
    const sortedEmployees = [...filteredEmployees].sort((a, b) => {
        if (!sortConfig.key) return 0;

        let res = 0;
        switch (sortConfig.key) {
            case 'nombre':
                res = (a.nombre + ' ' + a.apellidos).localeCompare(b.nombre + ' ' + b.apellidos, 'es', { sensitivity: 'base' });
                break;
            case 'puesto':
                // Ordenamos por nombre de puesto y secundariamente por departamento
                const posA = a.puesto?.nombre || '';
                const posB = b.puesto?.nombre || '';
                res = posA.localeCompare(posB, 'es', { sensitivity: 'base' });
                if (res === 0) {
                    const deptA = a.departamento?.nombre || '';
                    const deptB = b.departamento?.nombre || '';
                    res = deptA.localeCompare(deptB, 'es', { sensitivity: 'base' });
                }
                break;
            case 'estado':
                res = (a.estado || 'active').localeCompare(b.estado || 'active');
                break;
            default:
                const valA = String(a[sortConfig.key] || '');
                const valB = String(b[sortConfig.key] || '');
                res = valA.localeCompare(valB, 'es', { sensitivity: 'base', numeric: true });
        }

        return sortConfig.direction === 'asc' ? res : -res;
    });

    // Paginación: Extracción del segmento a renderizar
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentEmployees = sortedEmployees.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

    const changePage = (pageNumber) => setCurrentPage(pageNumber);

    if (loading) return (
        <div className="min-h-screen bg-transparent animate-fade-in w-full">
            {/* Header Skeleton */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-300 dark:border-slate-700 overflow-hidden mb-10">
                <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-300 dark:border-slate-700">
                    <div className="space-y-3">
                        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                        <div className="h-4 w-80 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                    </div>
                    <div className="flex gap-3">
                        <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse"></div>
                        <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse"></div>
                    </div>
                </div>
                {/* Search & Filter Skeleton */}
                <div className="p-5 md:p-6 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-300 dark:border-slate-700">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="h-12 flex-1 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse"></div>
                        <div className="h-12 w-full md:w-64 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse"></div>
                    </div>
                </div>
                {/* Table Skeleton */}
                <div className="p-6">
                    <div className="space-y-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-16 w-full bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 animate-pulse"></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-transparent">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-300 dark:border-slate-700 overflow-hidden mb-10 transition-colors">
                <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-300 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800/50 transition-colors">
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight transition-colors">Directorio de Empleados</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium transition-colors">Gestiona tu equipo y consulta información de contacto.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="px-4 py-2 bg-corporate/10 text-corporate font-bold rounded-xl text-sm border border-corporate/20 shadow-sm flex items-center gap-2">
                            <i className="fa-solid fa-users text-base"></i>
                            {employees.length} trabajadores
                        </span>
                        {isHrOrAdmin && (
                            <button onClick={() => setIsAddModalOpen(true)} className="bg-corporate hover:bg-corporate-dark text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                                <i className="fa-solid fa-plus text-base"></i>
                                Añadir
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-6 md:p-8 pb-0 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative w-full sm:w-96">
                        <i className="fa-solid fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500"></i>
                        <input
                            type="text"
                            placeholder="Buscar por nombre, DNI, email o puesto..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-corporate/20 focus:border-corporate/50 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto p-6 md:p-8">
                    <table className="w-full text-left border-separate border-spacing-y-3">
                        <thead>
                            <tr className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest px-4 transition-colors">
                                <th className="px-4 pb-2 font-bold text-left cursor-pointer hover:text-corporate transition-colors group" onClick={() => handleSort('nombre')}>
                                    <div className="flex items-center gap-2">
                                        <span>Empleado</span>
                                        <i className={'fa-solid ' + (sortConfig.key === 'nombre' ? (sortConfig.direction === 'asc' ? 'fa-sort-up text-corporate' : 'fa-sort-down text-corporate') : 'fa-sort opacity-20 group-hover:opacity-50') + ' text-xs mt-1 transition-opacity'}></i>
                                    </div>
                                </th>
                                <th className="px-4 pb-2 font-bold hidden md:table-cell text-left">DNI</th>
                                <th className="px-4 pb-2 font-bold hidden sm:table-cell text-left cursor-pointer hover:text-corporate transition-colors group" onClick={() => handleSort('puesto')}>
                                    <div className="flex items-center gap-2">
                                        <span>Puesto y Dept.</span>
                                        <i className={'fa-solid ' + (sortConfig.key === 'puesto' ? (sortConfig.direction === 'asc' ? 'fa-sort-up text-corporate' : 'fa-sort-down text-corporate') : 'fa-sort opacity-20 group-hover:opacity-50') + ' text-xs mt-1 transition-opacity'}></i>
                                    </div>
                                </th>
                                <th className="px-4 pb-2 font-bold hidden lg:table-cell text-left">Rol</th>
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
                                <tr key={emp.id} className="bg-white dark:bg-slate-800 shadow-[0_4px_15px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-none dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-300 rounded-2xl group border border-slate-200 dark:border-slate-700">
                                    <td className="p-4 rounded-l-2xl border-t border-b border-l border-slate-100 dark:border-slate-700 group-hover:border-corporate/20 dark:group-hover:border-corporate/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-corporate text-white font-bold flex items-center justify-center shrink-0 border border-corporate/20 overflow-hidden shadow-sm">
                                                {emp.photo ? (
                                                    <img src={emp.photo} alt={`${emp.nombre}`} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-xs uppercase">{emp.nombre.charAt(0)}{emp.apellidos.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-white text-base transition-colors">{emp.nombre} {emp.apellidos}</p>
                                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 transition-colors">{emp.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 font-mono font-medium text-slate-600 dark:text-slate-400 hidden md:table-cell border-t border-b border-slate-100 dark:border-slate-700 group-hover:border-corporate/20 dark:group-hover:border-corporate/50 transition-colors">
                                        {maskDni(emp.dni)}
                                    </td>
                                    <td className="p-4 font-medium text-slate-600 dark:text-slate-300 hidden sm:table-cell border-t border-b border-slate-100 dark:border-slate-700 group-hover:border-corporate/20 dark:group-hover:border-corporate/50 transition-colors">
                                        <div>{emp.puesto?.nombre || 'Sin puesto'}</div>
                                        <div className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">{emp.departamento?.nombre || 'Sin departamento'}</div>
                                    </td>
                                    <td className="p-4 font-medium text-slate-600 hidden lg:table-cell border-t border-b border-slate-100 dark:border-slate-700 group-hover:border-corporate/20 dark:group-hover:border-corporate/50 transition-colors">
                                        <span className={"inline-flex items-center px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md " +
                                            (formatRole(emp.roles) === 'Administrador' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                                                formatRole(emp.roles) === 'RRHH' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                                                    'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300')}>
                                            {formatRole(emp.roles)}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center border-t border-b border-slate-100 dark:border-slate-700 group-hover:border-corporate/20 dark:group-hover:border-corporate/50 transition-colors">
                                        <div className={'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border ' + (emp.estado === 'inactive' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800')}>
                                            <div className={'w-1.5 h-1.5 rounded-full ' + (emp.estado === 'inactive' ? 'bg-red-500' : 'bg-emerald-500')}></div>
                                            {emp.estado === 'inactive' ? 'Inactivo' : 'Activo'}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right rounded-r-2xl border-t border-b border-r border-slate-100 dark:border-slate-700 group-hover:border-corporate/20 dark:group-hover:border-corporate/50 transition-colors">
                                        {isHrOrAdmin && (
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleDocsClick(emp)}
                                                    className="text-slate-400 dark:text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400 bg-slate-50 dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 font-bold w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-sm"
                                                    title="Gestionar Documentos"
                                                >
                                                    <i className="fa-solid fa-file-invoice"></i>
                                                </button>
                                                {emp.has_2fa_active && (
                                                    <button
                                                        onClick={() => handleReset2FA(emp)}
                                                        className="text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 font-bold w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-sm"
                                                        title="Resetear 2FA (Emergencia)"
                                                    >
                                                        <i className="fa-solid fa-unlock-keyhole"></i>
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleEditClick(emp)}
                                                    className="text-slate-400 dark:text-slate-500 hover:text-corporate bg-slate-50 dark:bg-slate-700 hover:bg-corporate/10 font-bold px-3 py-2.5 rounded-xl transition-all inline-flex items-center gap-2 group-hover:shadow-sm"
                                                >
                                                    <span className="text-xs hidden lg:block">Editar</span>
                                                    <i className="fa-solid fa-pen-to-square"></i>
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Controles de Paginación */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6 px-2">
                            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                Mostrando <span className="font-bold text-corporate">{currentEmployees.length > 0 ? indexOfFirstItem + 1 : 0}-{Math.min(indexOfLastItem, filteredEmployees.length)}</span> de <span className="font-bold text-slate-800 dark:text-white">{filteredEmployees.length}</span>
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => changePage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={'px-3 py-1.5 rounded-lg text-sm font-bold border ' + (currentPage === 1 ? 'border-slate-100 dark:border-slate-700 text-slate-300 dark:text-slate-600 bg-slate-50 dark:bg-slate-800 cursor-not-allowed' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-corporate/5 hover:border-corporate/20 hover:text-corporate transition-all shadow-sm')}
                                >
                                    Anterior
                                </button>

                                <div className="flex items-center gap-1 hidden sm:flex">
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => changePage(i + 1)}
                                            className={'w-8 h-8 rounded-lg text-sm font-bold transition-all flex items-center justify-center ' + (currentPage === i + 1 ? 'bg-corporate text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-corporate/10 hover:text-corporate border border-transparent hover:border-corporate/20')}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => changePage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={'px-3 py-1.5 rounded-lg text-sm font-bold border ' + (currentPage === totalPages ? 'border-slate-100 dark:border-slate-700 text-slate-300 dark:text-slate-600 bg-slate-50 dark:bg-slate-800 cursor-not-allowed' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-corporate/5 hover:border-corporate/20 hover:text-corporate transition-all shadow-sm')}
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal para añadir empleado */}
                <AnimatePresence>
                {isAddModalOpen && (
                    <ModalPortal>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md transition-colors"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 dark:border-slate-700 flex flex-col max-h-[90vh] transition-colors"
                            >
                                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 transition-colors">
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white transition-colors">Añadir Nuevo Empleado</h3>
                                    <button onClick={() => setIsAddModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                                        <i className="fa-solid fa-xmark"></i>
                                    </button>
                                </div>
                                <div className="p-6 overflow-y-auto custom-scrollbar">
                                    {formError && (
                                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm font-medium transition-colors">
                                            <i className="fa-solid fa-circle-exclamation mr-2"></i>
                                            {formError}
                                        </div>
                                    )}
                                    <form onSubmit={handleAddEmployee} className="space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 transition-colors">Nombre</label>
                                                <input type="text" required value={newEmployee.name} onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:border-corporate dark:focus:border-corporate-light focus:ring-2 focus:ring-corporate/20 dark:focus:ring-corporate/40 outline-none transition-all" placeholder="Ej. Ana" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 transition-colors">Apellidos</label>
                                                <input type="text" required value={newEmployee.surname} onChange={e => setNewEmployee({ ...newEmployee, surname: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:border-corporate dark:focus:border-corporate-light focus:ring-2 focus:ring-corporate/20 dark:focus:ring-corporate/40 outline-none transition-all" placeholder="Ej. García" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 transition-colors">DNI</label>
                                                <input type="text" required value={newEmployee.dni} onChange={e => setNewEmployee({ ...newEmployee, dni: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:border-corporate dark:focus:border-corporate-light focus:ring-2 focus:ring-corporate/20 dark:focus:ring-corporate/40 outline-none transition-all" placeholder="12345678Z" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 transition-colors">Email</label>
                                                <input type="email" required value={newEmployee.email} onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:border-corporate dark:focus:border-corporate-light focus:ring-2 focus:ring-corporate/20 dark:focus:ring-corporate/40 outline-none transition-all" placeholder="correo@ejemplo.com" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 transition-colors">Teléfono</label>
                                                <input type="text" value={newEmployee.phone} onChange={e => setNewEmployee({ ...newEmployee, phone: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:border-corporate dark:focus:border-corporate-light focus:ring-2 focus:ring-corporate/20 dark:focus:ring-corporate/40 outline-none transition-all" placeholder="Ej. 600000000" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 transition-colors">Dirección</label>
                                                <input type="text" value={newEmployee.address} onChange={e => setNewEmployee({ ...newEmployee, address: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:border-corporate dark:focus:border-corporate-light focus:ring-2 focus:ring-corporate/20 dark:focus:ring-corporate/40 outline-none transition-all" placeholder="Dirección completa" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 transition-colors">Puesto a desempeñar</label>
                                                <select value={newEmployee.position_id} onChange={e => setNewEmployee({ ...newEmployee, position_id: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:border-corporate dark:focus:border-corporate-light focus:ring-2 focus:ring-corporate/20 dark:focus:ring-corporate/40 outline-none transition-all">
                                                    <option value="">Selecciona un puesto...</option>
                                                    {positions.map(p => (
                                                        <option key={p.id} value={p.id}>{p.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {isStrictAdmin && (
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 transition-colors">Rol de Sistema</label>
                                                    <select value={newEmployee.roles} onChange={e => setNewEmployee({ ...newEmployee, roles: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:border-corporate dark:focus:border-corporate-light focus:ring-2 focus:ring-corporate/20 dark:focus:ring-corporate/40 outline-none transition-all">
                                                        <option value="employee">Empleado Básico</option>
                                                        <option value="hr_director">Recursos Humanos (RRHH)</option>
                                                        <option value="admin">Administrador Total</option>
                                                    </select>
                                                </div>
                                            )}
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 transition-colors">Departamento</label>
                                                <select value={newEmployee.department_id} onChange={e => setNewEmployee({ ...newEmployee, department_id: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:border-corporate dark:focus:border-corporate-light focus:ring-2 focus:ring-corporate/20 dark:focus:ring-corporate/40 outline-none transition-all">
                                                    <option value="">Selecciona un departamento...</option>
                                                    {departments.map(d => (
                                                        <option key={d.id} value={d.id}>{d.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 transition-colors">Fecha de Contratación</label>
                                                <input type="date" required value={newEmployee.hired_at} onChange={e => setNewEmployee({ ...newEmployee, hired_at: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:border-corporate dark:focus:border-corporate-light focus:ring-2 focus:ring-corporate/20 dark:focus:ring-corporate/40 outline-none transition-all color-scheme-light dark:color-scheme-dark" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 transition-colors">Fin Periodo de Prueba (Opcional)</label>
                                                <input type="date" value={newEmployee.probation_until} onChange={e => setNewEmployee({ ...newEmployee, probation_until: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:border-corporate dark:focus:border-corporate-light focus:ring-2 focus:ring-corporate/20 dark:focus:ring-corporate/40 outline-none transition-all color-scheme-light dark:color-scheme-dark" />
                                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium transition-colors">Si se deja vacío, se aplicará la política global ({globalSettings?.probation_months_default || 6} meses).</span>
                                            </div>
                                        </div>

                                        <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700 mt-6 transition-colors">
                                            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                                Cancelar
                                            </button>
                                            <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 rounded-xl font-bold bg-corporate hover:bg-corporate-dark text-white transition-colors shadow-md flex items-center gap-2 disabled:opacity-70">
                                                {isSubmitting ? (
                                                    <><i className="fa-solid fa-spinner fa-spin"></i> Guardando...</>
                                                ) : (
                                                    <><i className="fa-solid fa-check"></i> Dar de Alta</>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        </motion.div>
                    </ModalPortal>
                )}
                </AnimatePresence>
                {/* Modal para editar empleado */}
                <AnimatePresence>
                {isEditModalOpen && editingEmployee && (
                    <ModalPortal>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md transition-colors"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 dark:border-slate-700 flex flex-col max-h-[90vh] transition-colors"
                            >
                            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 transition-colors">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white transition-colors">Editar Empleado: {editingEmployee.name}</h3>
                                <button onClick={() => setIsEditModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto custom-scrollbar">
                                <form onSubmit={handleUpdateEmployee} className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 transition-colors">Nombre</label>
                                                <input type="text" required value={editingEmployee.name} onChange={e => setEditingEmployee({ ...editingEmployee, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:border-corporate dark:focus:border-corporate-light focus:ring-2 focus:ring-corporate/20 dark:focus:ring-corporate/40 outline-none transition-all" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 transition-colors">Apellidos</label>
                                                <input type="text" required value={editingEmployee.surname} onChange={e => setEditingEmployee({ ...editingEmployee, surname: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:border-corporate dark:focus:border-corporate-light focus:ring-2 focus:ring-corporate/20 dark:focus:ring-corporate/40 outline-none transition-all" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 transition-colors">Email</label>
                                                <input type="email" required value={editingEmployee.email} onChange={e => setEditingEmployee({ ...editingEmployee, email: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:border-corporate dark:focus:border-corporate-light focus:ring-2 focus:ring-corporate/20 dark:focus:ring-corporate/40 outline-none transition-all" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 transition-colors">DNI</label>
                                                <input type="text" required value={editingEmployee.dni} onChange={e => setEditingEmployee({ ...editingEmployee, dni: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:border-corporate dark:focus:border-corporate-light focus:ring-2 focus:ring-corporate/20 dark:focus:ring-corporate/40 outline-none transition-all" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 transition-colors">Teléfono</label>
                                                <input type="text" value={editingEmployee.phone} onChange={e => setEditingEmployee({ ...editingEmployee, phone: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:border-corporate dark:focus:border-corporate-light focus:ring-2 focus:ring-corporate/20 dark:focus:ring-corporate/40 outline-none transition-all" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 transition-colors">Dirección</label>
                                                <input type="text" value={editingEmployee.address} onChange={e => setEditingEmployee({ ...editingEmployee, address: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:border-corporate dark:focus:border-corporate-light focus:ring-2 focus:ring-corporate/20 dark:focus:ring-corporate/40 outline-none transition-all" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 transition-colors">Puesto</label>
                                                <select value={editingEmployee.position_id} onChange={e => setEditingEmployee({ ...editingEmployee, position_id: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:border-corporate dark:focus:border-corporate-light focus:ring-2 focus:ring-corporate/20 dark:focus:ring-corporate/40 outline-none transition-all">
                                                    {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 transition-colors">Departamento</label>
                                                <select value={editingEmployee.department_id} onChange={e => setEditingEmployee({ ...editingEmployee, department_id: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:border-corporate dark:focus:border-corporate-light focus:ring-2 focus:ring-corporate/20 dark:focus:ring-corporate/40 outline-none transition-all">
                                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 transition-colors">Estado</label>
                                                <select value={editingEmployee.status} onChange={e => setEditingEmployee({ ...editingEmployee, status: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:border-corporate dark:focus:border-corporate-light focus:ring-2 focus:ring-corporate/20 dark:focus:ring-corporate/40 outline-none transition-all">
                                                    <option value="active">Activo</option>
                                                    <option value="inactive">Inactivo</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 transition-colors">Fecha Contratación</label>
                                                <input type="date" required value={editingEmployee.hired_at} onChange={e => setEditingEmployee({ ...editingEmployee, hired_at: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:border-corporate dark:focus:border-corporate-light focus:ring-2 focus:ring-corporate/20 dark:focus:ring-corporate/40 outline-none transition-all color-scheme-light dark:color-scheme-dark" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 transition-colors">Fin Periodo Prueba</label>
                                                <input type="date" value={editingEmployee.probation_until} onChange={e => setEditingEmployee({ ...editingEmployee, probation_until: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:border-corporate dark:focus:border-corporate-light focus:ring-2 focus:ring-corporate/20 dark:focus:ring-corporate/40 outline-none transition-all color-scheme-light dark:color-scheme-dark" />
                                            </div>
                                            {isStrictAdmin && (
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 transition-colors">Rol de Sistema</label>
                                                    <select
                                                        value={editingEmployee.roles && editingEmployee.roles.length > 0 ? editingEmployee.roles[0] : 'employee'}
                                                        onChange={e => setEditingEmployee({ ...editingEmployee, roles: [e.target.value] })}
                                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:border-corporate dark:focus:border-corporate-light focus:ring-2 focus:ring-corporate/20 dark:focus:ring-corporate/40 outline-none transition-all"
                                                    >
                                                        <option value="employee">Empleado Básico</option>
                                                        <option value="hr_director">Recursos Humanos (RRHH)</option>
                                                        <option value="admin">Administrador Total</option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700 mt-6 transition-colors">
                                            <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                                Cancelar
                                            </button>
                                            <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 rounded-xl font-bold bg-corporate hover:bg-corporate-dark text-white transition-colors shadow-md flex items-center gap-2">
                                            {isSubmitting ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-save"></i>}
                                            Guardar Cambios
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                </ModalPortal>
                )}
                </AnimatePresence>

                {/* Modal para gestionar DOCUMENTOS del empleado (Rediseño Premium) */}
                <AnimatePresence>
                {isDocsModalOpen && selectedEmployeeForDocs && (
                    <ModalPortal>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-5xl overflow-hidden border border-white/20 dark:border-slate-700 flex flex-col h-[85vh] transition-all duration-500 scale-100"
                            >
                            {/* Cabecera Premium */}
                            <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-slate-50 dark:from-slate-800 to-white dark:to-slate-800 relative overflow-hidden transition-colors">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-corporate opacity-[0.03] dark:opacity-10 rounded-full translate-x-12 -translate-y-12 transition-opacity"></div>
                                <div className="relative z-10 flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-corporate/10 dark:bg-corporate/20 text-corporate flex items-center justify-center text-2xl shadow-inner border border-corporate/5 dark:border-corporate/10 transition-colors">
                                        <i className="fa-solid fa-folder-tree"></i>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2 transition-colors">
                                            Gestión Documental
                                            <span className="px-3 py-1 bg-corporate/10 dark:bg-corporate/20 text-corporate dark:text-corporate-light text-[10px] uppercase tracking-[0.2em] rounded-full border border-corporate/10 dark:border-corporate/20 font-black transition-colors">Admin Mode</span>
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium transition-colors">Expediente de <span className="text-slate-800 dark:text-slate-200 font-bold transition-colors">{selectedEmployeeForDocs.nombre} {selectedEmployeeForDocs.apellidos}</span></p>
                                    </div>
                                </div>
                                <button onClick={() => setIsDocsModalOpen(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400 transition-all duration-300 group shadow-sm transition-colors">
                                    <i className="fa-solid fa-xmark text-xl transition-transform duration-300 group-hover:rotate-90"></i>
                                </button>
                            </div>

                            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                                {/* Panel IZQ: Formulario de Subida (Más visual) */}
                                <div className="w-full md:w-[400px] p-8 bg-slate-50/50 dark:bg-slate-900/30 border-r border-slate-100 dark:border-slate-700 overflow-y-auto transition-colors">
                                    <div className="mb-10">
                                        <div className="w-12 h-1 px-1 bg-corporate/20 rounded-full mb-4"></div>
                                        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1 transition-colors">Nueva Carga</h4>
                                        <h3 className="text-xl font-black text-slate-800 dark:text-white transition-colors">Preparar archivo</h3>
                                    </div>

                                    <form onSubmit={handleUploadDoc} className="space-y-8">
                                        <div className="relative group">
                                            <div className="absolute -inset-2 bg-gradient-to-r from-corporate/20 to-indigo-500/20 rounded-[2.5rem] blur opacity-0 group-hover:opacity-100 transition duration-700"></div>
                                            <div className="relative bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm transition-all duration-500 group-hover:border-corporate/20 dark:group-hover:border-corporate/40 group-hover:shadow-xl group-hover:shadow-corporate/5">
                                                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-widest pl-1 transition-colors">Selección de origen</label>
                                                <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-600 rounded-[1.5rem] py-10 px-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all cursor-pointer overflow-hidden group/drop">
                                                    <div className="absolute inset-0 bg-corporate opacity-0 group-hover/drop:opacity-[0.02] dark:group-hover/drop:opacity-10 transition-opacity"></div>
                                                    <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center mb-4 group-hover/drop:scale-110 group-hover/drop:bg-corporate/10 dark:group-hover/drop:bg-corporate/20 transition-all duration-500">
                                                        <i className={`fa-solid ${newDoc.file ? 'fa-file-circle-check text-emerald-500 dark:text-emerald-400' : 'fa-cloud-arrow-up text-slate-300 dark:text-slate-500'} text-3xl transition-colors`}></i>
                                                    </div>
                                                    <p className="text-xs font-black text-slate-600 dark:text-slate-300 text-center truncate max-w-full px-2 transition-colors">
                                                        {newDoc.file ? newDoc.file.name : 'Suelta un archivo aquí'}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-slate-300 dark:text-slate-500 mt-2 uppercase tracking-wide transition-colors">PDF, JPG o PNG</p>
                                                    <input
                                                        type="file" required
                                                        onChange={e => setNewDoc({ ...newDoc, file: e.target.files[0], title: e.target.files[0]?.name.split('.')[0] || '' })}
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6 bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 border-dashed relative transition-colors">
                                            <div className="absolute -top-3 left-6 px-3 bg-white dark:bg-slate-800 text-[9px] font-black text-corporate dark:text-corporate-light uppercase tracking-widest border border-slate-100 dark:border-slate-700 rounded-lg transition-colors">Nueva Carga</div>
                                            <div>
                                                <div className="flex justify-between items-end mb-1.5 px-1">
                                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none transition-colors">Título del documento</label>
                                                    <span className="text-[9px] font-bold text-corporate/60 dark:text-corporate-light/60 italic leading-none transition-colors">Puedes escribir →</span>
                                                </div>
                                                <div className="relative group/input">
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center pointer-events-none text-slate-300 dark:text-slate-600 group-focus-within/input:text-corporate dark:group-focus-within/input:text-corporate-light transition-colors">
                                                        <i className="fa-solid fa-pen-nib"></i>
                                                    </div>
                                                    <input
                                                        type="text" required
                                                        placeholder="Ej: Nómina Marzo 2026"
                                                        id="new-doc-title"
                                                        value={newDoc.title}
                                                        onChange={e => setNewDoc({ ...newDoc, title: e.target.value })}
                                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-700 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-corporate/5 dark:focus:ring-corporate/10 focus:border-corporate/40 outline-none transition-all placeholder:font-medium placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-inner color-scheme-light dark:color-scheme-dark"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-widest pl-1 transition-colors">Año Fiscal</label>
                                                    <select
                                                        value={newDoc.period_year}
                                                        onChange={e => setNewDoc({ ...newDoc, period_year: e.target.value })}
                                                        className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2x text-sm font-black text-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-corporate/5 dark:focus:ring-corporate/10 transition-all cursor-pointer hover:bg-white dark:hover:bg-slate-800"
                                                    >
                                                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-widest pl-1 transition-colors">Mes</label>
                                                    <select
                                                        value={newDoc.period_month}
                                                        onChange={e => setNewDoc({ ...newDoc, period_month: e.target.value })}
                                                        className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-black text-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-corporate/5 dark:focus:ring-corporate/10 transition-all cursor-pointer hover:bg-white dark:hover:bg-slate-800"
                                                    >
                                                        {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, i) => (
                                                            <option key={i + 1} value={i + 1}>{m}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest pl-1 transition-colors">Categoría Documental</label>
                                                <div className="grid grid-cols-2 gap-2.5">
                                                    {[
                                                        { id: 'payroll', label: 'Nómina', icon: 'fa-file-invoice-dollar', color: 'bg-emerald-500' },
                                                        { id: 'contract', label: 'Contrato', icon: 'fa-file-signature', color: 'bg-blue-500' },
                                                        { id: 'certificate', label: 'Certificado', icon: 'fa-award', color: 'bg-amber-500' },
                                                        { id: 'other', label: 'Otros', icon: 'fa-box-archive', color: 'bg-slate-500' }
                                                    ].map(cat => (
                                                        <button
                                                            key={cat.id}
                                                            type="button"
                                                            onClick={() => setNewDoc({ ...newDoc, type: cat.id })}
                                                            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden group/cat ${newDoc.type === cat.id ? 'bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100 text-white dark:text-slate-900 shadow-lg scale-[1.05] z-10' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-slate-200 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                                                        >
                                                            {newDoc.type === cat.id && <div className={`absolute left-0 top-0 bottom-0 w-1 ${cat.color}`}></div>}
                                                            <i className={`fa-solid ${cat.icon} text-sm transition-transform duration-500 group-hover/cat:scale-110 ${newDoc.type === cat.id ? 'text-white dark:text-slate-900' : 'text-slate-200 dark:text-slate-600'}`}></i>
                                                            <span className="relative z-10">{cat.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isUploadingDoc}
                                            className="w-full py-5 bg-gradient-to-br from-corporate to-indigo-700 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-corporate/20 hover:shadow-corporate/40 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 overflow-hidden relative group/submit"
                                        >
                                            <div className="absolute inset-0 bg-white opacity-0 group-hover/submit:opacity-10 transition-opacity"></div>
                                            {isUploadingDoc ? (
                                                <><i className="fa-solid fa-circle-notch fa-spin"></i> Subiendo...</>
                                            ) : (
                                                <><i className="fa-solid fa-cloud-arrow-up text-sm"></i> Lanzar al Expediente</>
                                            )}
                                        </button>
                                    </form>
                                </div>

                                {/* Panel DER: Listado de archivos (Premium & Clean) */}
                                <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-800 relative transition-colors">
                                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-slate-50/50 dark:from-slate-800/50 to-transparent pointer-events-none transition-colors"></div>

                                    <div className="flex items-center justify-between mb-10 relative z-10">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight transition-colors">Expediente Digital</h4>
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                            </div>
                                            <p className="text-sm text-slate-400 dark:text-slate-500 font-medium tracking-tight transition-colors">Documentación oficial custodiada bajo protocolos de seguridad.</p>
                                        </div>
                                        <div className="px-5 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-slate-200 dark:shadow-slate-900/20 transition-colors">
                                            {employeeDocs.length} Colecciones
                                        </div>
                                    </div>

                                    {docsLoading ? (
                                        <div className="flex flex-col items-center justify-center py-32 gap-6 relative z-10">
                                            <div className="relative">
                                                <div className="w-20 h-20 rounded-3xl border-4 border-slate-50 dark:border-slate-700 animate-pulse transition-colors"></div>
                                                <div className="absolute inset-0 border-t-4 border-corporate rounded-3xl animate-spin"></div>
                                            </div>
                                            <div className="text-center">
                                                <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest block transition-colors">Accediendo al servidor</span>
                                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter transition-colors">Sincronizando metadatos...</span>
                                            </div>
                                        </div>
                                    ) : employeeDocs.length === 0 ? (
                                        <div className="text-center py-24 bg-slate-50/40 dark:bg-slate-900/40 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-700 flex flex-col items-center relative z-10 transition-colors">
                                            <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-sm border border-slate-50 dark:border-slate-700 transform -rotate-6 transition-colors">
                                                <i className="fa-regular fa-folder-open text-4xl text-slate-200 dark:text-slate-600"></i>
                                            </div>
                                            <h5 className="text-xl font-black text-slate-400 dark:text-slate-500 transition-colors">Expediente vacío</h5>
                                            <p className="text-slate-300 dark:text-slate-600 text-sm mt-3 max-w-[280px] font-medium leading-relaxed transition-colors">No hay registros para este empleado. Comienza cargando un archivo desde el panel de control.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 relative z-10">
                                            {employeeDocs.map(doc => {
                                                const isImage = ['jpg', 'jpeg', 'png'].includes(doc.mime?.split('/')?.[1]?.toLowerCase());
                                                return (
                                                    <div key={doc.id} className="p-6 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-corporate/20 dark:hover:border-corporate/40 transition-all duration-700 flex flex-col justify-between group relative overflow-hidden translate-y-0 hover:-translate-y-2">
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 dark:bg-slate-700/50 rounded-bl-[4rem] -translate-y-8 translate-x-8 group-hover:bg-corporate/5 dark:group-hover:bg-corporate/10 transition-all duration-700"></div>

                                                        <div className="relative z-10 flex items-start gap-5">
                                                            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-2xl shrink-0 shadow-inner border transition-all duration-500 group-hover:scale-110 ${doc.type === 'payroll' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' :
                                                                doc.type === 'contract' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 border-blue-100 dark:border-blue-800' :
                                                                    doc.type === 'certificate' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-500 dark:text-amber-400 border-amber-100 dark:border-amber-800' :
                                                                        'bg-slate-50 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-600'
                                                                }`}>
                                                                <i className={`fa-solid ${doc.type === 'payroll' ? 'fa-file-invoice-dollar' :
                                                                    doc.type === 'contract' ? 'fa-file-signature' :
                                                                        doc.type === 'certificate' ? 'fa-award' :
                                                                            isImage ? 'fa-file-image' : 'fa-file-pdf'
                                                                    }`}></i>
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-[0.15em] transition-colors ${doc.type === 'payroll' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' :
                                                                        doc.type === 'contract' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400' :
                                                                            doc.type === 'certificate' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' :
                                                                                'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-600'
                                                                        }`}>
                                                                        {doc.type === 'other' ? 'Otros' : doc.type.toUpperCase()}
                                                                    </span>
                                                                    <span className="text-[10px] font-black text-slate-300 dark:text-slate-500 transition-colors">{doc.period_month}/{doc.period_year}</span>
                                                                </div>

                                                                {editingDocTitleId === doc.id ? (
                                                                    <div className="flex flex-col gap-2 mb-2 bg-slate-50 dark:bg-slate-900 p-4 rounded-3xl border-2 border-corporate/30 dark:border-corporate/50 shadow-inner animate-fade-in transition-colors">
                                                                        <div className="flex items-center gap-2">
                                                                            <input
                                                                                type="text"
                                                                                value={tempDocTitle}
                                                                                onChange={e => setTempDocTitle(e.target.value)}
                                                                                className="flex-1 bg-white dark:bg-slate-800 border-2 border-corporate rounded-xl px-4 py-3 text-sm font-black text-slate-800 dark:text-white outline-none focus:ring-8 focus:ring-corporate/5 dark:focus:ring-corporate/10 transition-all color-scheme-light dark:color-scheme-dark"
                                                                                autoFocus
                                                                                onKeyDown={e => e.key === 'Enter' && handleUpdateDocTitle(doc.id)}
                                                                            />
                                                                        </div>
                                                                        <div className="flex gap-2">
                                                                            <button
                                                                                onClick={() => handleUpdateDocTitle(doc.id)}
                                                                                className="flex-1 bg-corporate text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-corporate-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-corporate/20"
                                                                            >
                                                                                <i className="fa-solid fa-check"></i> Confirmar
                                                                            </button>
                                                                            <button
                                                                                onClick={() => setEditingDocTitleId(null)}
                                                                                className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-300 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                                                                            >
                                                                                Cancelar
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-4 group/title mb-2">
                                                                        <div
                                                                            onClick={() => { setEditingDocTitleId(doc.id); setTempDocTitle(doc.title); }}
                                                                            className="flex-1 min-w-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 p-2 -ml-2 rounded-xl transition-all"
                                                                        >
                                                                            <h5 className="font-black text-slate-800 dark:text-white text-lg leading-tight truncate-multiline transition-colors" title="Click para renombrar">
                                                                                {doc.title}
                                                                            </h5>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => { setEditingDocTitleId(doc.id); setTempDocTitle(doc.title); }}
                                                                            className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-corporate dark:text-corporate-light shadow-sm hover:bg-corporate hover:text-white dark:hover:bg-corporate transition-all flex items-center justify-center shrink-0 group-hover/title:scale-110 active:scale-95"
                                                                            title="Cambiar título"
                                                                        >
                                                                            <i className="fa-solid fa-pen-to-square text-xs"></i>
                                                                        </button>
                                                                    </div>
                                                                )}

                                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight transition-colors">{(doc.size / 1024 / 1024).toFixed(2)} MB • {doc.mime?.split('/')?.[1]?.toUpperCase() || 'ARCHIVO'}</p>
                                                            </div>
                                                        </div>

                                                        <div className="relative z-10 mt-8 pt-5 border-t border-slate-50 dark:border-slate-700 flex items-center justify-between transition-colors">
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] text-slate-300 dark:text-slate-500 font-black uppercase tracking-widest transition-colors">Estado</span>
                                                                <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-bold flex items-center gap-1 transition-colors">Validado <i className="fa-solid fa-circle-check text-[8px]"></i></span>
                                                            </div>
                                                            <div className="flex gap-2.5">
                                                                <button
                                                                    onClick={async () => {
                                                                        const res = await documentService.downloadDocument(doc.id);
                                                                        const url = window.URL.createObjectURL(new Blob([res.data]));
                                                                        const link = document.createElement('a'); link.href = url;
                                                                        const ext = isImage ? (doc.mime?.split('/')?.[1] || 'jpg') : 'pdf';
                                                                        link.setAttribute('download', `${doc.title}.${ext}`); link.click();
                                                                    }}
                                                                    className="w-11 h-11 rounded-2xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-900 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-white transition-all duration-300 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800 hover:border-slate-900 dark:hover:border-slate-600 hover:scale-110 active:scale-95"
                                                                    title="Descargar"
                                                                >
                                                                    <i className="fa-solid fa-download text-sm"></i>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteDoc(doc.id)}
                                                                    className="w-11 h-11 rounded-2xl bg-slate-50 dark:bg-slate-900 hover:bg-red-500 dark:hover:bg-red-600 text-slate-400 dark:text-slate-500 hover:text-white transition-all duration-300 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800 hover:border-red-500 dark:hover:border-red-600 hover:scale-110 active:scale-95"
                                                                    title="Eliminar"
                                                                >
                                                                    <i className="fa-solid fa-trash-can text-sm"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </ModalPortal>
                )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Employees;