import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Caso, CaseStatus, Agente } from '../types';
import { STATE_COLORS } from '../constants';
import { AlertCircle, Clock, Users, ArrowUpRight, ChevronRight, Activity, Info, RefreshCw, Filter, UserPlus, Bell, ArrowRightLeft, TrendingUp, TrendingDown, X } from 'lucide-react';

type FilterPeriod = 'hoy' | 'semana' | 'mes';
type FilterType = 'todos' | 'criticos' | 'vencidos' | string;

const SupervisorPanel: React.FC = () => {
  const [casos, setCasos] = useState<Caso[]>([]);
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [periodFilter, setPeriodFilter] = useState<FilterPeriod>('hoy');
  const [typeFilter, setTypeFilter] = useState<FilterType>('todos');
  const [agentFilter, setAgentFilter] = useState<string>('todos');
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [casosData, agentesData] = await Promise.all([
        api.getCases(),
        api.getAgentes()
      ]);
      setCasos(casosData);
      setAgentes(agentesData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const casosAbiertos = useMemo(() => {
    return casos.filter(c => c.status !== CaseStatus.RESUELTO);
  }, [casos]);
  
  const casosCriticos = useMemo(() => {
    return casos.filter(c => c.diasAbierto >= c.categoria.slaDias || c.status === CaseStatus.ESCALADO);
  }, [casos]);

  const filteredCasos = useMemo(() => {
    let filtered = [...casos];
    
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    if (periodFilter === 'hoy') {
      filtered = filtered.filter(c => new Date(c.createdAt) >= startOfDay);
    } else if (periodFilter === 'semana') {
      filtered = filtered.filter(c => new Date(c.createdAt) >= startOfWeek);
    } else if (periodFilter === 'mes') {
      filtered = filtered.filter(c => new Date(c.createdAt) >= startOfMonth);
    }

    if (typeFilter === 'criticos') {
      filtered = filtered.filter(c => c.diasAbierto >= c.categoria.slaDias || c.status === CaseStatus.ESCALADO);
    } else if (typeFilter === 'vencidos') {
      filtered = filtered.filter(c => c.diasAbierto > c.categoria.slaDias);
    }

    if (agentFilter !== 'todos') {
      filtered = filtered.filter(c => c.agenteAsignado.idAgente === agentFilter);
    }

    return filtered;
  }, [casos, periodFilter, typeFilter, agentFilter]);
  
  const casosVencidos = casosAbiertos.filter(c => c.diasAbierto > c.categoria.slaDias);
  const casosEnRiesgo = casosAbiertos.filter(c => {
    const diasRestantes = c.categoria.slaDias - c.diasAbierto;
    return diasRestantes > 0 && diasRestantes <= 1;
  });
  const casosDentroSLA = casosAbiertos.filter(c => {
    const diasRestantes = c.categoria.slaDias - c.diasAbierto;
    return diasRestantes > 1;
  });

  const slaPromedio = casosAbiertos.length > 0 
    ? Math.round((casosDentroSLA.length / casosAbiertos.length) * 100)
    : 100;

  const agentesActivos = agentes.filter(a => a.estado === 'Activo').length;
  const totalAgentes = agentes.length;

  const casosCriticosOrdenados = useMemo(() => {
    return [...casosCriticos].sort((a, b) => {
      if (a.status === CaseStatus.ESCALADO && b.status !== CaseStatus.ESCALADO) return -1;
      if (a.status !== CaseStatus.ESCALADO && b.status === CaseStatus.ESCALADO) return 1;
      return b.diasAbierto - a.diasAbierto;
    });
  }, [casosCriticos]);

  const casosCriticosHoy = useMemo(() => {
    return casosCriticosOrdenados.filter(c => {
      const hoy = new Date().toDateString();
      return new Date(c.createdAt).toDateString() === hoy || c.diasAbierto >= c.categoria.slaDias;
    });
  }, [casosCriticosOrdenados]);

  const slaAyer = 94;
  const slaCambio = slaPromedio - slaAyer;

  const handleReasignar = (e: React.MouseEvent, casoId: string) => {
    e.stopPropagation();
    navigate(`/app/casos/${casoId}?action=reasignar`);
  };

  const handleEscalar = (e: React.MouseEvent, casoId: string) => {
    e.stopPropagation();
    navigate(`/app/casos/${casoId}?action=escalar`);
  };

  const handleNotificar = (e: React.MouseEvent, casoId: string) => {
    e.stopPropagation();
    console.log('Notificar agente:', casoId);
  };

  const getSeverityColor = (caso: Caso) => {
    if (caso.status === CaseStatus.ESCALADO) return 'bg-red-600';
    if (caso.diasAbierto > caso.categoria.slaDias) return 'bg-red-500';
    if (caso.diasAbierto >= caso.categoria.slaDias - 1) return 'bg-amber-500';
    return 'bg-orange-400';
  };

  const getAgenteStats = (agenteId: string) => {
    const casosAgente = casosAbiertos.filter(c => c.agenteAsignado.idAgente === agenteId);
    const criticosAgente = casosAgente.filter(c => c.diasAbierto >= c.categoria.slaDias || c.status === CaseStatus.ESCALADO);
    const dentroSLA = casosAgente.filter(c => {
      const diasRestantes = c.categoria.slaDias - c.diasAbierto;
      return diasRestantes > 0;
    });
    const cumplimientoSLA = casosAgente.length > 0 
      ? Math.round((dentroSLA.length / casosAgente.length) * 100)
      : 100;
    
    return {
      casos: casosAgente.length,
      criticos: criticosAgente.length,
      cumplimientoSLA,
      tiempoPromedio: '2.5h'
    };
  };

  const Tooltip: React.FC<{ id: string; content: string; children: React.ReactNode }> = ({ id, content, children }) => (
    <div className="relative group">
      {children}
      {showTooltip === id && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
        </div>
      )}
    </div>
  );

  const SkeletonCard = () => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-24 mb-4"></div>
      <div className="h-8 bg-slate-200 rounded w-16"></div>
    </div>
  );

  if (loading && casos.length === 0) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500 font-medium">
            Última actualización: {lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            title="Actualizar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {casosCriticosHoy.length > 0 && (
            <div className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg font-semibold">
              {casosCriticosHoy.length} caso{casosCriticosHoy.length !== 1 ? 's' : ''} crítico{casosCriticosHoy.length !== 1 ? 's' : ''} requiere acción hoy
            </div>
          )}
          {slaCambio !== 0 && (
            <div className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 ${
              slaCambio > 0 ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {slaCambio > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              SLA {slaCambio > 0 ? 'subió' : 'bajó'} vs ayer
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-xl border border-slate-200">
        <Filter className="w-4 h-4 text-slate-400" />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setPeriodFilter('hoy')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              periodFilter === 'hoy' 
                ? 'bg-slate-900 text-white border border-slate-700' 
                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => setPeriodFilter('semana')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              periodFilter === 'semana' 
                ? 'bg-slate-900 text-white border border-slate-700' 
                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setPeriodFilter('mes')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              periodFilter === 'mes' 
                ? 'bg-slate-900 text-white border border-slate-700' 
                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Mes
          </button>
        </div>
        <div className="h-4 w-px bg-slate-300"></div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTypeFilter('todos')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              typeFilter === 'todos' 
                ? 'bg-slate-900 text-white border border-slate-700' 
                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setTypeFilter('criticos')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              typeFilter === 'criticos' 
                ? 'bg-red-100 text-red-700 border border-red-300' 
                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Solo críticos
          </button>
          <button
            onClick={() => setTypeFilter('vencidos')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              typeFilter === 'vencidos' 
                ? 'bg-red-100 text-red-700 border border-red-300' 
                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Solo vencidos
          </button>
        </div>
        <div className="h-4 w-px bg-slate-300"></div>
        <select
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value)}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <option value="todos">Todos los agentes</option>
          {agentes.map(agente => (
            <option key={agente.idAgente} value={agente.idAgente}>{agente.nombre}</option>
          ))}
        </select>
        {(periodFilter !== 'hoy' || typeFilter !== 'todos' || agentFilter !== 'todos') && (
          <button
            onClick={() => {
              setPeriodFilter('hoy');
              setTypeFilter('todos');
              setAgentFilter('todos');
            }}
            className="ml-auto px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        <Tooltip id="casos-abiertos" content="Total de casos activos en el sistema">
          <div 
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow cursor-help relative h-full"
            onMouseEnter={() => setShowTooltip('casos-abiertos')}
            onMouseLeave={() => setShowTooltip(null)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Casos Abiertos</p>
                <Info className="w-3 h-3 text-slate-400 flex-shrink-0" />
              </div>
              <h3 className="text-xl font-black text-slate-900">{casosAbiertos.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center flex-shrink-0">
              <Activity className="w-5 h-5 text-white" />
            </div>
          </div>
        </Tooltip>

        <Tooltip id="casos-criticos" content="Casos que requieren atención inmediata">
          <div 
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow cursor-help relative h-full"
            onMouseEnter={() => setShowTooltip('casos-criticos')}
            onMouseLeave={() => setShowTooltip(null)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Casos Críticos</p>
                <Info className="w-3 h-3 text-slate-400 flex-shrink-0" />
              </div>
              <h3 className="text-xl font-black text-red-600">{casosCriticos.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </Tooltip>

        <Tooltip id="sla-promedio" content="Porcentaje de casos cumpliendo SLA">
          <div 
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-help relative h-full"
            onMouseEnter={() => setShowTooltip('sla-promedio')}
            onMouseLeave={() => setShowTooltip(null)}
          >
            <div className="flex items-start justify-between gap-2 h-full">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SLA Promedio</p>
                  <Info className="w-3 h-3 text-slate-400 flex-shrink-0" />
                </div>
                <h3 className="text-xl font-black text-amber-600">{slaPromedio}%</h3>
              </div>
              <div className="flex items-start gap-2 flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div className="space-y-1 flex flex-col justify-center">
                  <div className="flex items-center justify-between gap-1.5 text-[10px]">
                    <span className="text-slate-600 font-semibold whitespace-nowrap">Dentro</span>
                    <span className="text-green-600 font-bold">{casosDentroSLA.length}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1.5 text-[10px]">
                    <span className="text-slate-600 font-semibold whitespace-nowrap">Riesgo</span>
                    <span className="text-amber-600 font-bold">{casosEnRiesgo.length}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1.5 text-[10px]">
                    <span className="text-slate-600 font-semibold whitespace-nowrap">Fuera</span>
                    <span className="text-red-600 font-bold">{casosVencidos.length}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5">
                    <div className="h-full flex">
                      <div className="bg-green-500" style={{ width: `${casosAbiertos.length > 0 ? (casosDentroSLA.length / casosAbiertos.length) * 100 : 0}%` }}></div>
                      <div className="bg-amber-500" style={{ width: `${casosAbiertos.length > 0 ? (casosEnRiesgo.length / casosAbiertos.length) * 100 : 0}%` }}></div>
                      <div className="bg-red-500" style={{ width: `${casosAbiertos.length > 0 ? (casosVencidos.length / casosAbiertos.length) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Tooltip>

        <Tooltip id="agentes-online" content="Agentes disponibles del total">
          <div 
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow cursor-help relative h-full"
            onMouseEnter={() => setShowTooltip('agentes-online')}
            onMouseLeave={() => setShowTooltip(null)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Agentes Online</p>
                <Info className="w-3 h-3 text-slate-400 flex-shrink-0" />
              </div>
              <h3 className="text-xl font-black text-green-600">{agentesActivos}/{totalAgentes}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Tooltip>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" /> Casos Críticos / Escalamientos
            </h3>
            <button 
              onClick={() => navigate('/app/casos')}
              className="text-sm font-bold text-slate-900 hover:text-slate-700 flex items-center gap-1 transition-colors"
            >
              Ver todos <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {casosCriticosOrdenados.length > 0 ? (
                casosCriticosOrdenados.map(caso => {
                  const severityColor = getSeverityColor(caso);
                  const isEscalado = caso.status === CaseStatus.ESCALADO;
                  const isVencido = caso.diasAbierto > caso.categoria.slaDias;
                  
                  return (
                    <div 
                      key={caso.id} 
                      onClick={() => navigate(`/app/casos/${caso.id}`)}
                      className={`p-4 transition-all cursor-pointer group ${
                        isEscalado ? 'bg-red-50/50 hover:bg-red-50' : 
                        isVencido ? 'bg-orange-50/50 hover:bg-orange-50' : 
                        'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-1 h-16 ${severityColor} rounded-full flex-shrink-0`}></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-black text-slate-900">{caso.id}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATE_COLORS[caso.status]}`}>
                              {caso.status}
                            </span>
                            {isEscalado && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                                ESCALADO
                              </span>
                            )}
                            {isVencido && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                                VENCIDO SLA
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-slate-700 truncate mb-1">{caso.subject}</p>
                          <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                            <span>Asignado a: <span className="font-bold text-slate-700">{caso.agenteAsignado.nombre}</span></span>
                            <span className="font-bold text-red-600">{caso.diasAbierto} días de atraso</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={(e) => handleReasignar(e, caso.id)}
                            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                            title="Reasignar"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleEscalar(e, caso.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Escalar"
                          >
                            <AlertCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleNotificar(e, caso.id)}
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                            title="Notificar agente"
                          >
                            <Bell className="w-4 h-4" />
                          </button>
                          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-10 text-center">
                  <p className="text-slate-400 font-medium italic">No hay casos críticos actualmente. ¡Buen trabajo!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-900" /> Rendimiento de Agentes
            </h3>
            {agentes.length > 4 && (
              <button 
                onClick={() => navigate('/app/agentes')}
                className="text-sm font-bold text-slate-900 hover:text-slate-700 flex items-center gap-1 transition-colors"
              >
                Ver todos <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            {agentes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {agentes.slice(0, 4).map((agente) => {
                  const estadoColors = {
                    'Activo': { color: 'bg-green-500', status: 'Activo' },
                    'Vacaciones': { color: 'bg-amber-400', status: 'Vacaciones' },
                    'Inactivo': { color: 'bg-slate-400', status: 'Inactivo' }
                  };
                  const estado = estadoColors[agente.estado as keyof typeof estadoColors] || estadoColors.Inactivo;
                  const stats = getAgenteStats(agente.idAgente);
                  
                  return (
                    <div key={agente.idAgente} className="p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-2.5 h-2.5 rounded-full ${estado.color} flex-shrink-0`}></div>
                          <p className="text-sm font-bold text-slate-800 truncate">{agente.nombre}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          estado.status === 'Activo' ? 'bg-green-100 text-green-700' :
                          estado.status === 'Vacaciones' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {estado.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="min-w-0">
                          <p className="text-slate-500 font-semibold mb-0.5 truncate">Casos</p>
                          <p className="text-sm font-black text-slate-700">{stats.casos}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-slate-500 font-semibold mb-0.5 truncate">Críticos</p>
                          <p className={`text-sm font-black ${stats.criticos > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                            {stats.criticos}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-slate-500 font-semibold mb-0.5 truncate">SLA</p>
                          <p className={`text-sm font-black ${
                            stats.cumplimientoSLA >= 90 ? 'text-green-600' :
                            stats.cumplimientoSLA >= 70 ? 'text-amber-600' :
                            'text-red-600'
                          }`}>
                            {stats.cumplimientoSLA}%
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-semibold truncate">Tiempo promedio</span>
                          <span className="text-slate-700 font-bold flex-shrink-0 ml-2">{stats.tiempoPromedio}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-slate-400 font-medium text-sm">No hay agentes registrados</p>
              </div>
            )}
            {agentes.length > 4 && (
              <button 
                onClick={() => navigate('/app/agentes')}
                className="w-full mt-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 border border-slate-100 rounded-lg hover:bg-slate-100 transition-all"
              >
                Ver todos ({agentes.length} agentes)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisorPanel;
