import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../api/axios';
import ModalPortal from './ModalPortal';

const CommandPalette = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ employees: [], news: [], documents: [] });
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const navigate = useNavigate();
    const inputRef = useRef(null);

    const quickActions = [
        { title: 'Nueva Solicitud de Vacaciones', link: '/vacaciones', icon: 'fa-sun', cmd: '⌘ N', category: 'Acciones Rápidas' },
        { title: 'Ver Mis Últimas Nóminas', link: '/documentos', icon: 'fa-file-invoice-dollar', cmd: '⌘ D', category: 'Acciones Rápidas' },
        { title: 'Consultar Directorio', link: '/empleados', icon: 'fa-address-book', cmd: '⌘ U', category: 'Acciones Rápidas' },
        { title: 'Ir al Tablón de Noticias', link: '/noticias', icon: 'fa-bullhorn', cmd: '⌘ B', category: 'Acciones Rápidas' },
    ];

    const staticSections = [
        { title: 'Dashboard Principal', link: '/', icon: 'fa-house', type: 'section' },
        { title: 'Solicitar Vacaciones / Horas Extra', link: '/vacaciones', icon: 'fa-umbrella-beach', type: 'section' },
        { title: 'Directorio de Empleados', link: '/empleados', icon: 'fa-users', type: 'section' },
        { title: 'Calendario de Ausencias', link: '/calendario', icon: 'fa-calendar-days', type: 'section' },
        { title: 'Nóminas y Documentos', link: '/documentos', icon: 'fa-file-invoice-dollar', type: 'section' },
        { title: 'Tablón de Anuncios', link: '/noticias', icon: 'fa-newspaper', type: 'section' },
        { title: 'Gestión de Vacaciones (Admin)', link: '/gestion-vacaciones', icon: 'fa-scale-balanced', type: 'section' },
    ];

    const filteredSections = query ? staticSections.filter(s => 
        s.title.toLowerCase().includes(query.toLowerCase())
    ) : [];

    const handleKeyDown = useCallback((e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            setIsOpen(prev => !prev);
        }
        if (e.key === 'Escape') setIsOpen(false);
    }, []);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    const fetchResults = async (q) => {
        if (q.length < 2) {
            setResults({ employees: [], news: [], documents: [] });
            return;
        }
        setLoading(true);
        try {
            const res = await axios.get(`/api/v1/search?q=${q}`);
            setResults(res.data);
        } catch (error) {
            console.error("Search error", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query) fetchResults(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    // Construct unified list
    const allItems = query === '' 
        ? quickActions 
        : [
            ...filteredSections.map(s => ({ ...s, category: 'Secciones' })),
            ...results.employees.map(e => ({ 
                title: `${e.nombre} ${e.apellidos}`, 
                link: `/empleados?search=${encodeURIComponent(e.nombre + ' ' + e.apellidos)}`, 
                icon: 'fa-user-tie', 
                type: 'employee', 
                category: 'Empleados', 
                id: e.id,
                cmd: `Empleado • ${e.puesto?.nombre || 'General'}`
            })),
            ...results.news.map(n => ({ title: n.title, link: `/noticias`, icon: 'fa-newspaper', type: 'news', category: 'Noticias', id: n.id })),
            ...results.documents.map(d => ({ title: d.title, link: `/documentos`, icon: 'fa-file-pdf', type: 'document', category: 'Documentos', id: d.id }))
        ];

    const handleSelect = (item) => {
        setIsOpen(false);
        navigate(item.link);
    };

    const navigateItems = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % allItems.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + allItems.length) % allItems.length);
        } else if (e.key === 'Enter') {
            if (allItems[selectedIndex]) handleSelect(allItems[selectedIndex]);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <ModalPortal>
                    <div className="fixed inset-0 z-[20000] flex items-start justify-center pt-[12vh] px-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => setIsOpen(false)}
                        />
                        
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-[0_45px_100px_rgba(0,0,0,0.5)] overflow-hidden border border-slate-200 dark:border-slate-800 relative z-20 flex flex-col"
                        >
                            {/* Search Engine Header */}
                            <div className="p-8 pb-4 relative">
                                <div className="flex items-center gap-6">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl ${loading ? 'text-corporate animate-spin' : 'text-slate-400 dark:text-slate-600 bg-slate-50 dark:bg-slate-800'}`}>
                                        <i className={`fa-solid ${loading ? 'fa-spinner' : 'fa-magnifying-glass'}`}></i>
                                    </div>
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        placeholder="Busca cualquier cosa..."
                                        className="flex-1 bg-transparent border-none outline-none text-2xl font-black text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 italic tracking-tighter"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={navigateItems}
                                    />
                                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">ESC para salir</span>
                                    </div>
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 overflow-y-auto max-h-[50vh] custom-scrollbar p-4 space-y-6">
                                {allItems.length > 0 ? (
                                    <div className="space-y-6">
                                        {Array.from(new Set(allItems.map(i => i.category))).map(cat => (
                                            <div key={cat} className="space-y-2">
                                                <div className="px-4 py-2 flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-corporate"></div>
                                                    <span className="text-[10px] items-center flex font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em] italic">
                                                        {cat}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-1 gap-1">
                                                    {allItems.filter(i => i.category === cat).map((item, idx) => {
                                                        const globalIdx = allItems.indexOf(item);
                                                        const isSelected = selectedIndex === globalIdx;
                                                        return (
                                                            <div
                                                                key={`${item.title}-${globalIdx}`}
                                                                className={`group flex items-center gap-4 p-4 rounded-3xl cursor-pointer transition-all ${
                                                                    isSelected 
                                                                    ? 'bg-corporate text-white shadow-xl shadow-corporate/20 -translate-y-0.5' 
                                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                                                                }`}
                                                                onClick={() => handleSelect(item)}
                                                                onMouseEnter={() => setSelectedIndex(globalIdx)}
                                                            >
                                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg transition-transform ${
                                                                    isSelected ? 'bg-white/20 rotate-12' : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                                                                }`}>
                                                                    <i className={`fa-solid ${item.icon}`}></i>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-black truncate text-sm italic">{item.title}</p>
                                                                    <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${isSelected ? 'text-white/60' : 'text-slate-400'}`}>
                                                                        {item.cmd || 'Navegar'}
                                                                    </p>
                                                                </div>
                                                                {isSelected && (
                                                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest italic animate-pulse">
                                                                        <span>Pulsar Enter</span>
                                                                        <i className="fa-solid fa-chevron-right text-[8px]"></i>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-20 text-center opacity-30">
                                        <i className="fa-solid fa-cloud-moon text-6xl mb-6"></i>
                                        <p className="text-sm font-black uppercase tracking-widest italic">No se ha encontrado nada para "{query}"</p>
                                    </div>
                                )}
                            </div>

                            {/* High-End Footer */}
                            <div className="p-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <div className="flex items-center gap-6">
                                     <div className="flex items-center gap-2">
                                         <kbd className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-[9px] font-black text-slate-400">↑↓</kbd>
                                         <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Navegar</span>
                                     </div>
                                     <div className="flex items-center gap-2">
                                         <kbd className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-[9px] font-black text-slate-400">↵</kbd>
                                         <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Seleccionar</span>
                                     </div>
                                </div>
                                <div className="flex items-center gap-2">
                                     <span className="text-[9px] font-black text-corporate-light uppercase tracking-widest italic">OmniSearch v2.0</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </ModalPortal>
            )}
        </AnimatePresence>
    );
};

export default CommandPalette;
