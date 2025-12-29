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
          className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center p-6 rounded-3xl shadow-xl border backdrop-blur-sm"
          style={{
            backgroundColor: 'rgba(30, 41, 59, 0.4)',
            borderColor: 'rgba(148, 163, 184, 0.15)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" style={{color: '#94a3b8'}} />
            <input
              type="text"
              placeholder="Buscar por ID, Cliente o Asunto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-5 py-4 border rounded-2xl focus:outline-none focus:ring-4 transition-all text-sm font-medium shadow-sm hover:shadow-md"
              style={{
                backgroundColor: 'rgba(30, 41, 59, 0.6)',
                borderColor: 'rgba(148, 163, 184, 0.3)',
                color: '#ffffff',
                '--tw-ring-color': 'var(--color-accent-blue)',
                '--tw-ring-opacity': '0.2'
              } as React.CSSProperties & { '--tw-ring-color': string, '--tw-ring-opacity': string }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-accent-blue)';
                e.target.style.boxShadow = '0 0 0 4px rgba(16, 122, 180, 0.15)';
                e.target.style.backgroundColor = 'rgba(30, 41, 59, 0.8)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(148, 163, 184, 0.3)';
                e.target.style.boxShadow = '';
                e.target.style.backgroundColor = 'rgba(30, 41, 59, 0.6)';
              }}
            />
          </div>
          
          <div className="flex gap-3 w-full md:w-auto flex-wrap">
            <div className="relative group">
              <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none transition-colors" style={{color: '#94a3b8'}} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-14 pr-10 py-4 border rounded-2xl focus:outline-none transition-all text-sm font-medium appearance-none cursor-pointer shadow-sm hover:shadow-md"
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.6)',
                  borderColor: 'rgba(148, 163, 184, 0.3)',
                  color: '#cbd5e1'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.8)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.6)';
                }}
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
                ? 'text-white border shadow-md'
                : 'border-slate-600'
            }`}
            style={quickFilter === 'all' ? {
              backgroundColor: 'rgb(15, 23, 42)',
              borderColor: 'rgb(15, 23, 42)'
            } : {
              backgroundColor: 'transparent',
              color: '#cbd5e1',
              borderColor: 'rgba(148, 163, 184, 0.3)'
            }}
            onMouseEnter={(e) => {
              if (quickFilter !== 'all') {
                e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.6)';
              }
            }}
            onMouseLeave={(e) => {
              if (quickFilter !== 'all') {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            Todos
          </button>
          <button
            onClick={() => setQuickFilter('escalados')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border-2 flex items-center gap-2 ${
              quickFilter === 'escalados'
                ? 'text-white border shadow-md'
                : ''
            }`}
            style={quickFilter === 'escalados' ? {
              backgroundColor: 'var(--color-brand-red)',
              borderColor: 'var(--color-brand-red)'
            } : {
              backgroundColor: 'transparent',
              color: '#f87171',
              borderColor: 'rgba(200, 21, 27, 0.3)'
            }}
            onMouseEnter={(e) => {
              if (quickFilter !== 'escalados') {
                e.currentTarget.style.backgroundColor = 'rgba(200, 21, 27, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (quickFilter !== 'escalados') {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <AlertTriangle className="w-4 h-4" />
            Escalados {filterCounts.escalados > 0 && `(${filterCounts.escalados})`}
          </button>
          <button
            onClick={() => setQuickFilter('vencidos')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border-2 flex items-center gap-2 ${
              quickFilter === 'vencidos'
                ? 'text-white border shadow-md'
                : ''
            }`}
            style={quickFilter === 'vencidos' ? {
              backgroundColor: '#f59e0b',
              borderColor: '#f59e0b'
            } : {
              backgroundColor: 'transparent',
              color: '#fbbf24',
              borderColor: 'rgba(245, 158, 11, 0.3)'
            }}
            onMouseEnter={(e) => {
              if (quickFilter !== 'vencidos') {
                e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (quickFilter !== 'vencidos') {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <Clock className="w-4 h-4" />
            Fuera de SLA {filterCounts.vencidos > 0 && `(${filterCounts.vencidos})`}
          </button>
          <button
            onClick={() => setQuickFilter('nuevos')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border-2 flex items-center gap-2 ${
              quickFilter === 'nuevos'
                ? 'text-white border shadow-md'
                : 'border-slate-600'
            }`}
            style={quickFilter === 'nuevos' ? {
              backgroundColor: 'var(--color-accent-blue)',
              borderColor: 'var(--color-accent-blue)'
            } : {
              backgroundColor: 'transparent',
              color: '#cbd5e1',
              borderColor: 'rgba(148, 163, 184, 0.3)'
            }}
            onMouseEnter={(e) => {
              if (quickFilter !== 'nuevos') {
                e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.6)';
              }
            }}
            onMouseLeave={(e) => {
              if (quickFilter !== 'nuevos') {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <CheckCircle2 className="w-4 h-4" />
            Nuevos {filterCounts.nuevos > 0 && `(${filterCounts.nuevos})`}
          </button>
          
          {/* Última actualización */}
          <div className="ml-auto flex items-center gap-2 text-xs" style={{color: '#94a3b8'}}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualizado: {lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
            <button
              onClick={loadCasos}
              disabled={loading}
              className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
              style={{color: '#94a3b8'}}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.color = '#cbd5e1';
                  e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#94a3b8';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Actualizar"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {loading && casos.length === 0 ? (
        <div className="rounded-3xl shadow-xl border overflow-hidden" style={{backgroundColor: 'rgba(30, 41, 59, 0.4)', borderColor: 'rgba(148, 163, 184, 0.15)'}}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b" style={{backgroundColor: 'rgba(30, 41, 59, 0.6)', borderColor: 'rgba(148, 163, 184, 0.15)'}}>
                <tr>
                  <th className="px-6 py-5 text-xs font-bold tracking-wide uppercase" style={{color: '#cbd5e1'}}>ID Caso</th>
                  <th className="px-6 py-5 text-xs font-bold tracking-wide uppercase" style={{color: '#cbd5e1'}}>Cliente</th>
                  <th className="px-6 py-5 text-xs font-bold tracking-wide uppercase" style={{color: '#cbd5e1'}}>Categoría</th>
                  <th className="px-6 py-5 text-xs font-bold tracking-wide uppercase" style={{color: '#cbd5e1'}}>Estado</th>
                  <th className="px-6 py-5 text-xs font-bold tracking-wide uppercase" style={{color: '#cbd5e1'}}>Agente</th>
                  <th className="px-6 py-5 text-xs font-bold tracking-wide uppercase" style={{color: '#cbd5e1'}}>Tiempo</th>
                  <th className="px-6 py-5 text-xs font-bold tracking-wide uppercase text-right" style={{color: '#cbd5e1'}}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map(i => (
                  <tr key={i} className="border-b animate-pulse" style={{borderColor: 'rgba(148, 163, 184, 0.15)'}}>
                    <td className="px-6 py-5"><div className="h-4 rounded w-24" style={{backgroundColor: 'rgba(148, 163, 184, 0.2)'}}></div></td>
                    <td className="px-6 py-5"><div className="h-4 rounded w-32" style={{backgroundColor: 'rgba(148, 163, 184, 0.2)'}}></div></td>
                    <td className="px-6 py-5"><div className="h-6 rounded w-20" style={{backgroundColor: 'rgba(148, 163, 184, 0.2)'}}></div></td>
                    <td className="px-6 py-5"><div className="h-6 rounded w-24" style={{backgroundColor: 'rgba(148, 163, 184, 0.2)'}}></div></td>
                    <td className="px-6 py-5"><div className="h-4 rounded w-20" style={{backgroundColor: 'rgba(148, 163, 184, 0.2)'}}></div></td>
                    <td className="px-6 py-5"><div className="h-4 rounded w-16" style={{backgroundColor: 'rgba(148, 163, 184, 0.2)'}}></div></td>
                    <td className="px-6 py-5 text-right"><div className="h-8 rounded w-8 ml-auto" style={{backgroundColor: 'rgba(148, 163, 184, 0.2)'}}></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl shadow-xl border p-16 text-center" style={{backgroundColor: 'rgba(30, 41, 59, 0.4)', borderColor: 'rgba(148, 163, 184, 0.15)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'}}>
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg" style={{backgroundColor: 'rgba(30, 41, 59, 0.6)'}}>
            <Search className="w-12 h-12" style={{color: '#94a3b8'}} />
          </div>
          <h3 className="text-xl font-bold mb-2" style={{color: '#ffffff'}}>No se encontraron casos</h3>
          <p className="text-sm font-medium mb-6" style={{color: '#94a3b8'}}>Intenta ajustar los filtros de búsqueda</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setQuickFilter('all');
            }}
            className="px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
            style={{backgroundColor: 'rgba(30, 41, 59, 0.6)', color: '#cbd5e1'}}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.6)';
            }}
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="rounded-3xl shadow-xl border overflow-hidden" style={{backgroundColor: 'rgba(30, 41, 59, 0.4)', borderColor: 'rgba(148, 163, 184, 0.15)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'}}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead 
                ref={tableHeaderRef}
                className={`border-b transition-all ${
                  isSticky ? 'sticky top-0 z-20 shadow-md' : ''
                }`}
                style={{backgroundColor: 'rgba(30, 41, 59, 0.6)', borderColor: 'rgba(148, 163, 184, 0.15)'}}
              >
                <tr>
                  <th className="px-6 py-5 text-xs font-bold tracking-wide uppercase" style={{color: '#cbd5e1'}}>
                    <button 
                      onClick={() => handleSort('priority')}
                      className="flex items-center gap-1 transition-colors"
                      style={{color: '#cbd5e1'}}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#cbd5e1';
                      }}
                    >
                      ID Caso
                      {sortColumn === 'priority' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-5 text-xs font-bold tracking-wide uppercase" style={{color: '#cbd5e1'}}>
                    <button 
                      onClick={() => handleSort('cliente')}
                      className="flex items-center gap-1 transition-colors"
                      style={{color: '#cbd5e1'}}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#cbd5e1';
                      }}
                    >
                      Cliente
                      {sortColumn === 'cliente' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-5 text-xs font-bold tracking-wide uppercase" style={{color: '#cbd5e1'}}>Categoría</th>
                  <th className="px-6 py-5 text-xs font-bold tracking-wide uppercase" style={{color: '#cbd5e1'}}>
                    <button 
                      onClick={() => handleSort('estado')}
                      className="flex items-center gap-1 transition-colors"
                      style={{color: '#cbd5e1'}}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#cbd5e1';
                      }}
                      title="Ordenar por estado del caso"
                    >
                      Estado
                      {sortColumn === 'estado' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-5 text-xs font-bold tracking-wide uppercase" style={{color: '#cbd5e1'}}>
                    <button 
                      onClick={() => handleSort('agent')}
                      className="flex items-center gap-1 transition-colors"
                      style={{color: '#cbd5e1'}}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#cbd5e1';
                      }}
                    >
                      Agente
                      {sortColumn === 'agent' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-5 text-xs font-bold tracking-wide uppercase" style={{color: '#cbd5e1'}}>
                    <button 
                      onClick={() => handleSort('createdAt')}
                      className="flex items-center gap-1 transition-colors"
                      style={{color: '#cbd5e1'}}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#cbd5e1';
                      }}
                      title="Días desde la creación del caso"
                    >
                      Tiempo Abierto
                      {sortColumn === 'createdAt' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-5 text-xs font-bold tracking-wide uppercase text-right" style={{color: '#cbd5e1'}}>Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{borderColor: 'rgba(148, 163, 184, 0.15)'}}>
                {filtered.map((caso, idx) => {
                  const priority = getRowPriority(caso);
                  const isHovered = hoveredRowId === caso.id;
                  const status = caso.status || (caso as any).estado;
                  const slaDias = caso.categoria?.slaDias || 3;
                  const diasAbierto = caso.diasAbierto || 0;
                  
                  return (
                    <React.Fragment key={caso.id}>
                      <tr 
                        className="transition-all duration-200 cursor-pointer group relative"
                        style={{
                          backgroundColor: isHovered ? 'rgba(30, 41, 59, 0.6)' : 'transparent',
                          borderLeft: priority === 'critical' 
                            ? '4px solid var(--color-brand-red)' 
                            : priority === 'warning'
                            ? '4px solid #f59e0b'
                            : '4px solid transparent'
                        }}
                        onMouseEnter={() => setHoveredRowId(caso.id)}
                        onMouseLeave={() => setHoveredRowId(null)}
                        onClick={() => {
                          navigate(`/app/casos/${caso.id}`);
                        }}
                      >
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold transition-colors" style={{color: '#ffffff'}}>
                            {caso.ticketNumber || (caso as any).idCaso}
                          </span>
                          {caso.subject && (
                            <span className="text-xs truncate max-w-xs" style={{color: '#94a3b8'}} title={caso.subject}>
                              {caso.subject}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-semibold" style={{color: '#cbd5e1'}}>{caso.clientName || caso.cliente?.nombreEmpresa}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center text-xs font-semibold px-3.5 py-2 rounded-xl border shadow-sm" style={{
                          backgroundColor: 'rgba(30, 41, 59, 0.6)',
                          color: '#cbd5e1',
                          borderColor: 'rgba(148, 163, 184, 0.2)'
                        }}>
                          {caso.category || caso.categoria?.nombre}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="relative group/estado">
                          <div className="flex flex-col gap-1.5">
                            <span className={`inline-flex items-center text-xs font-bold px-3.5 py-2 rounded-md border w-fit ${STATE_COLORS[status as CaseStatus]}`}>
                              {status}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs" style={{color: '#94a3b8'}}>
                              {caso.slaExpired && (
                                <>
                                  <Clock className="w-3 h-3 flex-shrink-0" style={{color: '#f87171'}} />
                                  <span className="font-medium" style={{color: '#f87171'}}>
                                    SLA vencido
                                  </span>
                                  {diasAbierto > 0 && <span>·</span>}
                                </>
                              )}
                              {!caso.slaExpired && diasAbierto > 0 && diasAbierto >= slaDias * 0.8 && (
                                <>
                                  <Clock className="w-3 h-3 flex-shrink-0" style={{color: '#fbbf24'}} />
                                  <span className="font-medium" style={{color: '#fbbf24'}}>
                                    En riesgo
                                  </span>
                                  <span>·</span>
                                </>
                              )}
                              {diasAbierto > 0 && (
                                <span>{diasAbierto} día{diasAbierto !== 1 ? 's' : ''}</span>
                              )}
                            </div>
                          </div>
                          <div className="absolute z-50 bottom-full left-0 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover/estado:opacity-100 transition-opacity pointer-events-none">
                            SLA: {slaDias} días · {diasAbierto} día{diasAbierto !== 1 ? 's' : ''} abierto
                            {caso.slaExpired && ' · Vencido'}
                            {!caso.slaExpired && diasAbierto >= slaDias * 0.8 && ' · En riesgo'}
                            <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-slate-900"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {caso.agentName ? (
                          <div className="relative group/agent">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-xs">
                                  {caso.agentName.charAt(0)}
                                </div>
                                <span className="text-sm font-semibold" style={{color: '#ffffff'}}>{caso.agentName}</span>
                              </div>
                              {caso.agenteAsignado?.casosActivos !== undefined && (
                                <span className="text-xs ml-10 font-medium" style={{color: '#94a3b8'}}>
                                  {caso.agenteAsignado.casosActivos} activo{caso.agenteAsignado.casosActivos !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            {caso.agenteAsignado?.casosActivos !== undefined && (
                              <div className="absolute z-50 bottom-full left-0 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover/agent:opacity-100 transition-opacity pointer-events-none">
                                {caso.agentName} tiene {caso.agenteAsignado.casosActivos} caso{caso.agenteAsignado.casosActivos !== 1 ? 's' : ''} activo{caso.agenteAsignado.casosActivos !== 1 ? 's' : ''}
                                <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-slate-900"></div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm italic" style={{color: '#64748b'}}>Sin asignar</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          {caso.diasAbierto !== undefined && (
                            <span className="text-sm font-bold" style={{
                              color: caso.slaExpired || (caso.status || (caso as any).estado) === CaseStatus.ESCALADO
                                ? 'var(--color-brand-red)'
                                : caso.categoria?.slaDias && caso.diasAbierto >= caso.categoria.slaDias * 0.8
                                ? '#f59e0b'
                                : '#22c55e'
                            }}>
                              {caso.diasAbierto} día{caso.diasAbierto !== 1 ? 's' : ''}
                            </span>
                          )}
                          {caso.createdAt && (
                            <span className="text-xs font-medium" style={{color: '#94a3b8'}}>
                              {new Date(caso.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-1">
                          {/* Acciones rápidas solo visibles en hover */}
                          {isHovered && (
                            <div className="flex items-center gap-1 rounded-lg p-1 border" style={{
                              backgroundColor: 'rgba(30, 41, 59, 0.6)',
                              borderColor: 'rgba(148, 163, 184, 0.2)'
                            }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/app/casos/${caso.id}`);
                                }}
                                className="p-2 rounded-md transition-all"
                                style={{color: '#94a3b8'}}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = '#cbd5e1';
                                  e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.8)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = '#94a3b8';
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                                title="Ver detalle"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Reasignar lógica aquí
                                }}
                                className="p-2 rounded-md transition-all"
                                style={{color: '#94a3b8'}}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = '#cbd5e1';
                                  e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.8)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = '#94a3b8';
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
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
                                  className="p-2 rounded-md transition-all"
                                  title="Escalar caso"
                                  style={{
                                    color: '#f87171'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(200, 21, 27, 0.2)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                >
                                  <ArrowUpRight className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )}
                          <div className="p-2 rounded-lg transition-all" style={{
                            backgroundColor: isHovered ? 'rgba(148, 163, 184, 0.2)' : 'transparent'
                          }}>
                            <ChevronRight className="w-5 h-5 transition-all" style={{
                              color: isHovered ? '#94a3b8' : '#64748b',
                              transform: isHovered ? 'translateX(4px)' : ''
                            }} />
                          </div>
                        </div>
                      </td>
                    </tr>
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
