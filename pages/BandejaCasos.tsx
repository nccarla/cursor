import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Case, CaseStatus, Cliente, Categoria, Channel } from '../types';
import { STATE_COLORS } from '../constants';
import { 
  Search, Plus, Filter, ChevronRight, ChevronDown, X, Eye, UserCheck, ArrowUpRight, 
  Clock, AlertTriangle, RefreshCw, ArrowUp, ArrowDown, CheckCircle2
} from 'lucide-react';

type QuickFilter = 'all' | 'escalados' | 'vencidos' | 'nuevos';
type SortColumn = 'priority' | 'estado' | 'cliente' | 'createdAt' | 'agent';
type SortDirection = 'asc' | 'desc';

const BandejaCasos: React.FC = () => {
  const [casos, setCasos] = useState<Case[]>([]);
  const [filtered, setFiltered] = useState<Case[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [sortColumn, setSortColumn] = useState<SortColumn>('priority');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const tableHeaderRef = useRef<HTMLTableSectionElement>(null);
  const [isSticky, setIsSticky] = useState(false);
  
  const [newCase, setNewCase] = useState({
    clienteId: '',
    categoriaId: '',
    contactChannel: Channel.WEB,
    subject: '',
    description: '',
    clientName: '',
    contactName: '',
    phone: '',
    email: '',
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadCasos();
    loadClientes();
    loadCategorias();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (tableHeaderRef.current) {
        const rect = tableHeaderRef.current.getBoundingClientRect();
        setIsSticky(rect.top <= 0);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadClientes = async () => {
    const data = await api.getClientes();
    setClientes(data);
  };

  const loadCategorias = async () => {
    const data = await api.getCategorias();
    setCategorias(data);
  };

  const handleClienteChange = async (clienteId: string) => {
    if (!clienteId) {
      setNewCase({
        ...newCase,
        clienteId: '',
        clientName: '',
        contactName: '',
        phone: '',
        email: '',
        contactChannel: Channel.WEB,
      });
      return;
    }

    const cliente = await api.getClienteById(clienteId);
    if (cliente) {
      setNewCase({
        ...newCase,
        clienteId: cliente.idCliente,
        clientName: cliente.nombreEmpresa,
        contactName: cliente.contactoPrincipal,
        phone: cliente.telefono,
        email: cliente.email,
      });
    }
  };

  const loadCasos = async () => {
    setLoading(true);
    const data = await api.getCases();
    setCasos([...data]);
    setLastUpdate(new Date());
    setLoading(false);
  };

  const getRowPriority = (caso: Case): 'critical' | 'warning' | 'normal' => {
    const status = caso.status || (caso as any).estado;
    if (status === CaseStatus.ESCALADO || caso.slaExpired) {
      return 'critical';
    }
    const diasAbierto = caso.diasAbierto || 0;
    const slaDias = caso.categoria?.slaDias || 3;
    if (diasAbierto >= slaDias * 0.8) {
      return 'warning';
    }
    return 'normal';
  };

  const formatTimeAgo = (createdAt: string) => {
    if (!createdAt) return 'N/A';
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffDays > 0) return `${diffDays} día${diffDays !== 1 ? 's' : ''}`;
    if (diffHours > 0) return `${diffHours}h`;
    return 'Hoy';
  };

  const getSLAStatus = (caso: Case) => {
    if (caso.slaExpired) return { text: 'SLA vencido', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
    const diasAbierto = caso.diasAbierto || 0;
    const slaDias = caso.categoria?.slaDias || 3;
    const percent = (diasAbierto / slaDias) * 100;
    if (percent >= 80) return { text: 'En riesgo', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
    return { text: 'En tiempo', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
  };

  const prioritizeCases = (casosList: Case[]): Case[] => {
    return [...casosList].sort((a, b) => {
      // Prioridad por estado
      const priorityOrder: Record<string, number> = {
        [CaseStatus.ESCALADO]: 4,
        [CaseStatus.EN_PROCESO]: 3,
        [CaseStatus.NUEVO]: 2,
        [CaseStatus.PENDIENTE_CLIENTE]: 1,
        [CaseStatus.RESUELTO]: 0,
        [CaseStatus.CERRADO]: -1
      };
      
      const aStatus = a.status || (a as any).estado;
      const bStatus = b.status || (b as any).estado;
      const aPriority = priorityOrder[aStatus] || 0;
      const bPriority = priorityOrder[bStatus] || 0;
      
      if (aPriority !== bPriority) return bPriority - aPriority;
      
      // Si ambos son escalados o vencidos, ordenar por días abierto
      if (a.slaExpired && b.slaExpired) {
        return (b.diasAbierto || 0) - (a.diasAbierto || 0);
      }
      if (a.slaExpired) return -1;
      if (b.slaExpired) return 1;
      
      // Luego por días abierto
      return (b.diasAbierto || 0) - (a.diasAbierto || 0);
    });
  };

  useEffect(() => {
    let result = [...casos];
    
    // Búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c => {
        const id = (c.id || c.ticketNumber || '').toLowerCase();
        const client = (c.clientName || c.cliente?.nombreEmpresa || '').toLowerCase();
        const subject = (c.subject || '').toLowerCase();
        return id.includes(term) || client.includes(term) || subject.includes(term);
      });
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      result = result.filter(c => {
        const status = c.status || (c as any).estado;
        return status === statusFilter;
      });
    }

    // Filtros rápidos
    if (quickFilter === 'escalados') {
      result = result.filter(c => (c.status || (c as any).estado) === CaseStatus.ESCALADO);
    } else if (quickFilter === 'vencidos') {
      result = result.filter(c => c.slaExpired);
    } else if (quickFilter === 'nuevos') {
      result = result.filter(c => (c.status || (c as any).estado) === CaseStatus.NUEVO);
    }

    // Ordenamiento
    if (sortColumn === 'priority') {
      result = prioritizeCases(result);
      if (sortDirection === 'asc') result.reverse();
    } else if (sortColumn === 'estado') {
      result.sort((a, b) => {
        const aStatus = (a.status || (a as any).estado || '').toString();
        const bStatus = (b.status || (b as any).estado || '').toString();
        return sortDirection === 'asc' 
          ? aStatus.localeCompare(bStatus)
          : bStatus.localeCompare(aStatus);
      });
    } else if (sortColumn === 'cliente') {
      result.sort((a, b) => {
        const aClient = (a.clientName || a.cliente?.nombreEmpresa || '').toString();
        const bClient = (b.clientName || b.cliente?.nombreEmpresa || '').toString();
        return sortDirection === 'asc'
          ? aClient.localeCompare(bClient)
          : bClient.localeCompare(aClient);
      });
    } else if (sortColumn === 'createdAt') {
      result.sort((a, b) => {
        const aDate = new Date(a.createdAt || 0).getTime();
        const bDate = new Date(b.createdAt || 0).getTime();
        return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
      });
    } else if (sortColumn === 'agent') {
      result.sort((a, b) => {
        const aAgent = (a.agentName || '').toString();
        const bAgent = (b.agentName || '').toString();
        return sortDirection === 'asc'
          ? aAgent.localeCompare(bAgent)
          : bAgent.localeCompare(aAgent);
      });
    }

    setFiltered(result);
  }, [searchTerm, statusFilter, quickFilter, sortColumn, sortDirection, casos]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const getFilterCounts = () => {
    const escalados = casos.filter(c => (c.status || (c as any).estado) === CaseStatus.ESCALADO).length;
    const vencidos = casos.filter(c => c.slaExpired).length;
    const nuevos = casos.filter(c => (c.status || (c as any).estado) === CaseStatus.NUEVO).length;
    return { escalados, vencidos, nuevos };
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCase({
        clienteId: newCase.clienteId,
        categoriaId: newCase.categoriaId,
        contactChannel: newCase.contactChannel,
        subject: newCase.subject,
        description: newCase.description,
        clientName: newCase.clientName,
        contactName: newCase.contactName,
        phone: newCase.phone,
        clientEmail: newCase.email,
        status: CaseStatus.NUEVO,
        createdAt: new Date().toISOString(),
      });
      setShowModal(false);
      setNewCase({ clienteId: '', categoriaId: '', contactChannel: Channel.WEB, subject: '', description: '', clientName: '', contactName: '', phone: '', email: '' });
      loadCasos();
    } catch (err) {
      alert('Error al crear el caso');
    }
  };

  const filterCounts = getFilterCounts();

  return (
    <div className="space-y-6">
      <div 
        className="flex flex-col gap-4"
      >
        {/* Barra superior de filtros operativos */}
        <div 
          className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center p-6 rounded-3xl shadow-xl border backdrop-blur-sm bg-white"
          style={{
            borderColor: 'rgba(226, 232, 240, 0.6)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por ID, Cliente o Asunto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:bg-white transition-all text-sm font-medium shadow-sm hover:shadow-md"
              style={{
                '--tw-ring-color': 'var(--color-accent-blue)',
                '--tw-ring-opacity': '0.2'
              } as React.CSSProperties & { '--tw-ring-color': string, '--tw-ring-opacity': string }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-accent-blue)';
                e.target.style.boxShadow = '0 0 0 4px rgba(16, 122, 180, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(226, 232, 240, 0.6)';
                e.target.style.boxShadow = '';
              }}
            />
          </div>
          
          <div className="flex gap-3 w-full md:w-auto flex-wrap">
            <div className="relative group">
              <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none transition-colors" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-14 pr-10 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none transition-all text-sm font-medium appearance-none cursor-pointer shadow-sm hover:bg-white hover:shadow-md"
                style={{color: 'var(--color-slate-700)'}}
              >
                <option value="all">Todos los Estados</option>
                {Object.values(CaseStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button 
              onClick={() => setShowModal(true)}
              className="text-white px-6 py-4 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
              style={{background: 'linear-gradient(135deg, var(--color-brand-red), var(--color-accent-red))'}}
            >
              <Plus className="w-5 h-5" /> Nuevo Caso
            </button>
          </div>
        </div>

        {/* Filtros rápidos tipo chips */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setQuickFilter('all')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border-2 ${
              quickFilter === 'all'
                ? 'bg-slate-800 text-white border-slate-800 shadow-md'
                : 'bg-white text-slate-700 border-2 border-slate-300 hover:border-slate-400'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setQuickFilter('escalados')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border-2 flex items-center gap-2 ${
              quickFilter === 'escalados'
                ? 'bg-red-600 text-white border-red-600 shadow-md'
                : 'bg-white text-red-700 border-2 border-red-300 hover:border-red-400'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Escalados {filterCounts.escalados > 0 && `(${filterCounts.escalados})`}
          </button>
          <button
            onClick={() => setQuickFilter('vencidos')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border-2 flex items-center gap-2 ${
              quickFilter === 'vencidos'
                ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                : 'bg-white text-amber-700 border-2 border-amber-300 hover:border-amber-400'
            }`}
          >
            <Clock className="w-4 h-4" />
            Fuera de SLA {filterCounts.vencidos > 0 && `(${filterCounts.vencidos})`}
          </button>
          <button
            onClick={() => setQuickFilter('nuevos')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border-2 flex items-center gap-2 ${
              quickFilter === 'nuevos'
                ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                : 'bg-white text-slate-700 border-2 border-slate-300 hover:border-slate-400'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Nuevos {filterCounts.nuevos > 0 && `(${filterCounts.nuevos})`}
          </button>
          
          {/* Última actualización */}
          <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualizado: {lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
            <button
              onClick={loadCasos}
              disabled={loading}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              title="Actualizar"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {loading && casos.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-xl border overflow-hidden" style={{borderColor: 'rgba(226, 232, 240, 0.6)'}}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gradient-to-r from-slate-50 via-slate-50 to-slate-100/80 border-b" style={{borderColor: 'rgba(226, 232, 240, 0.6)'}}>
                <tr>
                  <th className="px-6 py-5 text-xs font-bold text-slate-700 tracking-wide uppercase">ID Caso</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-700 tracking-wide uppercase">Cliente</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-700 tracking-wide uppercase">Categoría</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-700 tracking-wide uppercase">Estado</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-700 tracking-wide uppercase">Agente</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-700 tracking-wide uppercase">Tiempo</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-700 tracking-wide uppercase text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map(i => (
                  <tr key={i} className="border-b animate-pulse" style={{borderColor: 'rgba(226, 232, 240, 0.3)'}}>
                    <td className="px-6 py-5"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                    <td className="px-6 py-5"><div className="h-4 bg-slate-200 rounded w-32"></div></td>
                    <td className="px-6 py-5"><div className="h-6 bg-slate-200 rounded w-20"></div></td>
                    <td className="px-6 py-5"><div className="h-6 bg-slate-200 rounded w-24"></div></td>
                    <td className="px-6 py-5"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                    <td className="px-6 py-5"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                    <td className="px-6 py-5 text-right"><div className="h-8 bg-slate-200 rounded w-8 ml-auto"></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-xl border p-16 text-center" style={{borderColor: 'rgba(226, 232, 240, 0.6)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'}}>
          <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Search className="w-12 h-12 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No se encontraron casos</h3>
          <p className="text-slate-500 text-sm font-medium mb-6">Intenta ajustar los filtros de búsqueda</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setQuickFilter('all');
            }}
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-xl border overflow-hidden" style={{borderColor: 'rgba(226, 232, 240, 0.6)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'}}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead 
                ref={tableHeaderRef}
                className={`bg-gradient-to-r from-slate-50 via-slate-50 to-slate-100/80 border-b transition-all ${
                  isSticky ? 'sticky top-0 z-20 shadow-md' : ''
                }`}
                style={{borderColor: 'rgba(226, 232, 240, 0.6)'}}
              >
                <tr>
                  <th className="px-6 py-5 text-xs font-bold text-slate-700 tracking-wide uppercase">
                    <button 
                      onClick={() => handleSort('priority')}
                      className="flex items-center gap-1 hover:text-slate-900 transition-colors"
                    >
                      ID Caso
                      {sortColumn === 'priority' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-700 tracking-wide uppercase">
                    <button 
                      onClick={() => handleSort('cliente')}
                      className="flex items-center gap-1 hover:text-slate-900 transition-colors"
                    >
                      Cliente
                      {sortColumn === 'cliente' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-700 tracking-wide uppercase">Categoría</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-700 tracking-wide uppercase">
                    <button 
                      onClick={() => handleSort('estado')}
                      className="flex items-center gap-1 hover:text-slate-900 transition-colors"
                      title="Ordenar por estado del caso"
                    >
                      Estado
                      {sortColumn === 'estado' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-700 tracking-wide uppercase">
                    <button 
                      onClick={() => handleSort('agent')}
                      className="flex items-center gap-1 hover:text-slate-900 transition-colors"
                    >
                      Agente
                      {sortColumn === 'agent' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-700 tracking-wide uppercase">
                    <button 
                      onClick={() => handleSort('createdAt')}
                      className="flex items-center gap-1 hover:text-slate-900 transition-colors"
                      title="Días desde la creación del caso"
                    >
                      Tiempo Abierto
                      {sortColumn === 'createdAt' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-700 tracking-wide uppercase text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{borderColor: 'rgba(226, 232, 240, 0.3)'}}>
                {filtered.map((caso, idx) => {
                  const priority = getRowPriority(caso);
                  const slaStatus = getSLAStatus(caso);
                  const isHovered = hoveredRowId === caso.id;
                  const isExpanded = expandedCaseId === caso.id;
                  const status = caso.status || (caso as any).estado;
                  
                  return (
                    <React.Fragment key={caso.id}>
                      <tr 
                        className="transition-all duration-200 cursor-pointer group relative hover:bg-slate-50/80"
                        style={{
                          borderLeft: priority === 'critical' 
                            ? '4px solid #dc2626' 
                            : priority === 'warning' 
                            ? '4px solid #f59e0b' 
                            : '4px solid transparent'
                        }}
                        onMouseEnter={() => setHoveredRowId(caso.id)}
                        onMouseLeave={() => setHoveredRowId(null)}
                        onClick={() => {
                          setExpandedCaseId(isExpanded ? null : caso.id);
                        }}
                      >
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold text-slate-900 group-hover:text-accent-blue transition-colors">
                            {caso.ticketNumber || (caso as any).idCaso}
                          </span>
                          {caso.subject && (
                            <span className="text-xs text-slate-500 truncate max-w-xs" title={caso.subject}>
                              {caso.subject}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-semibold text-slate-800">{caso.clientName || caso.cliente?.nombreEmpresa}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center text-xs font-semibold px-3.5 py-2 bg-slate-100 text-slate-700 rounded-xl border border-slate-200 shadow-sm">
                          {caso.category || caso.categoria?.nombre}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1.5">
                          <span className={`inline-flex items-center text-xs font-bold px-3.5 py-2 rounded-xl border shadow-sm w-fit ${STATE_COLORS[status as CaseStatus]}`}>
                            {status}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            {slaStatus && slaStatus.text !== 'En tiempo' && (
                              <>
                                <Clock className="w-3 h-3 flex-shrink-0" />
                                <span className={slaStatus.text === 'SLA vencido' ? 'text-red-600 font-medium' : 'text-amber-600 font-medium'}>
                                  {slaStatus.text}
                                </span>
                                {caso.diasAbierto !== undefined && <span>·</span>}
                              </>
                            )}
                            {caso.diasAbierto !== undefined && (
                              <span>{caso.diasAbierto} día{caso.diasAbierto !== 1 ? 's' : ''} abierto</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {caso.agentName ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-xs">
                                {caso.agentName.charAt(0)}
                              </div>
                              <span className="text-sm font-medium text-slate-700">{caso.agentName}</span>
                            </div>
                            {caso.agenteAsignado?.casosActivos !== undefined && (
                              <span className="text-xs text-slate-500 ml-10">
                                {caso.agenteAsignado.casosActivos} activo{caso.agenteAsignado.casosActivos !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400 italic">Sin asignar</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          {caso.diasAbierto !== undefined && (
                            <span className={`text-sm font-bold ${
                              caso.diasAbierto >= 4 ? 'text-red-600' : caso.diasAbierto >= 2 ? 'text-amber-600' : 'text-green-600'
                            }`}>
                              {caso.diasAbierto} día{caso.diasAbierto !== 1 ? 's' : ''}
                            </span>
                          )}
                          {caso.createdAt && (
                            <span className="text-xs text-slate-500">
                              {new Date(caso.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-2">
                          {/* Acciones rápidas solo visibles en hover */}
                          {isHovered && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/app/casos/${caso.id}`);
                                }}
                                className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-all shadow-sm"
                                title="Ver detalle"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Reasignar lógica aquí
                                }}
                                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all shadow-sm"
                                title="Reasignar agente"
                              >
                                <UserCheck className="w-4 h-4" />
                              </button>
                              {status !== CaseStatus.ESCALADO && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Escalar lógica aquí
                                  }}
                                  className="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 transition-all shadow-sm"
                                  title="Escalar caso"
                                >
                                  <ArrowUpRight className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                          <div className={`p-2 rounded-xl transition-all ${
                            isHovered || isExpanded ? 'bg-accent-blue/10' : 'bg-slate-100 group-hover:bg-slate-200'
                          }`}>
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 transition-all" style={{
                                color: 'var(--color-accent-blue)'
                              }} />
                            ) : (
                              <ChevronRight className="w-5 h-5 transition-all" style={{
                                color: isHovered ? 'var(--color-accent-blue)' : 'var(--color-slate-400)',
                                transform: isHovered ? 'translateX(4px)' : ''
                              }} />
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={7} className="px-6 py-4 border-t border-slate-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm text-slate-600 mb-2">
                                <span className="font-semibold">Descripción:</span> {caso.description || 'Sin descripción'}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-slate-500">
                                {caso.createdAt && (
                                  <span>Creado: {new Date(caso.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                )}
                                {caso.clientEmail && <span>Email: {caso.clientEmail}</span>}
                                {caso.clientPhone && <span>Tel: {caso.clientPhone}</span>}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/app/casos/${caso.id}`);
                              }}
                              className="ml-4 px-4 py-2 bg-accent-blue text-white rounded-xl text-sm font-semibold hover:bg-accent-blue/90 transition-colors flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              Ver Detalle Completo
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && createPortal(
        <div 
          className="backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            margin: 0,
            padding: '1rem',
            zIndex: 9999,
            backgroundColor: 'rgba(20, 84, 120, 0.6)',
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl transform animate-in zoom-in-95 scale-in duration-300 border border-slate-200/50 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white flex-shrink-0">
              <div>
                <h3 className="text-2xl font-semibold text-slate-900">Crear Nuevo Caso SAC</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Completa los datos del caso</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
            <form onSubmit={handleCreateCase} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 tracking-normal mb-2">Cliente <span className="text-red-500">*</span></label>
                    <select
                      required
                      value={newCase.clienteId}
                      onChange={(e) => handleClienteChange(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all bg-slate-50 focus:bg-white font-medium appearance-none cursor-pointer"
                    >
                      <option value="">Seleccione un cliente...</option>
                      {clientes.map((cliente) => (
                        <option key={cliente.idCliente} value={cliente.idCliente}>
                          {cliente.idCliente} - {cliente.nombreEmpresa}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-600 tracking-normal mb-2">Empresa / Cliente</label>
                    <input 
                      type="text" required 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all bg-slate-50 focus:bg-white font-medium"
                      placeholder="Nombre de la empresa"
                      value={newCase.clientName}
                      onChange={e => setNewCase({...newCase, clientName: e.target.value})}
                      readOnly={!!newCase.clienteId}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 tracking-normal mb-2">Contacto Principal</label>
                      <input 
                        type="text"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all bg-slate-50 focus:bg-white font-medium"
                        placeholder="Nombre contacto"
                        value={newCase.contactName}
                        onChange={e => setNewCase({...newCase, contactName: e.target.value})}
                        readOnly={!!newCase.clienteId}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 tracking-normal mb-2">Teléfono</label>
                      <input 
                        type="tel"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all bg-slate-50 focus:bg-white font-medium"
                        placeholder="+50370000000"
                        value={newCase.phone}
                        onChange={e => setNewCase({...newCase, phone: e.target.value})}
                        readOnly={!!newCase.clienteId}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 tracking-normal mb-2">Email Cliente</label>
                    <input 
                      type="email" required 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all bg-slate-50 focus:bg-white font-medium"
                      placeholder="cliente@empresa.com"
                      value={newCase.email}
                      onChange={e => setNewCase({...newCase, email: e.target.value})}
                      readOnly={!!newCase.clienteId}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 tracking-normal mb-2">Medio de Contacto <span className="text-red-500">*</span></label>
                    <select
                      required
                      value={newCase.contactChannel}
                      onChange={(e) => setNewCase({...newCase, contactChannel: e.target.value as Channel})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all bg-slate-50 focus:bg-white font-medium appearance-none cursor-pointer"
                    >
                      <option value={Channel.WEB}>Web</option>
                      <option value={Channel.EMAIL}>Email</option>
                      <option value={Channel.WHATSAPP}>WhatsApp</option>
                      <option value={Channel.TELEFONO}>Teléfono</option>
                      <option value={Channel.REDES_SOCIALES}>Redes Sociales</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 tracking-normal mb-2">Categoría <span className="text-red-500">*</span></label>
                    <select
                      required
                      value={newCase.categoriaId}
                      onChange={(e) => setNewCase({...newCase, categoriaId: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all bg-slate-50 focus:bg-white font-medium appearance-none cursor-pointer"
                    >
                      <option value="">Seleccione una categoría...</option>
                      {categorias.length > 0 ? (
                        categorias.map((categoria) => (
                          <option key={categoria.idCategoria} value={categoria.idCategoria}>
                            {categoria.nombre} — SLA {categoria.slaDias} días
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>Cargando categorías...</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-2">Asunto <span className="text-red-500">*</span></label>
                    <input 
                      type="text" required 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all bg-slate-50 focus:bg-white font-medium"
                      placeholder="Resumen del caso"
                      value={newCase.subject}
                      onChange={e => setNewCase({...newCase, subject: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-2">Descripción <span className="text-red-500">*</span></label>
                    <textarea 
                      required rows={8}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all bg-slate-50 focus:bg-white font-medium resize-none"
                      placeholder="Detalles del caso..."
                      value={newCase.description}
                      onChange={e => setNewCase({...newCase, description: e.target.value})}
                    ></textarea>
                  </div>
                </div>
              </div>
              <div className="pt-2 flex gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 py-3.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all border border-slate-200"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3.5 text-white text-sm font-bold rounded-xl transition-all"
                  style={{background: 'linear-gradient(to right, var(--color-brand-red), var(--color-accent-red))', boxShadow: '0 12px 30px rgba(200, 21, 27, 0.25)'}}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, var(--color-accent-red), var(--color-brand-red))';
                    e.currentTarget.style.boxShadow = '0 14px 34px rgba(245, 41, 56, 0.28)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, var(--color-brand-red), var(--color-accent-red))';
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(200, 21, 27, 0.25)';
                  }}
                >
                  Registrar Caso
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default BandejaCasos;
