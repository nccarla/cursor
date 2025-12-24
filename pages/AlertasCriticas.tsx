
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Caso, CaseStatus, Agente } from '../types';
import { STATE_COLORS } from '../constants';
import { 
  ShieldAlert, 
  Clock, 
  AlertTriangle, 
  User, 
  Send, 
  ArrowUpRight, 
  Eye,
  RefreshCw,
  Circle,
  Users,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import AnimatedNumber from '../components/AnimatedNumber';

type Priority = 'Critica' | 'Alta' | 'Media';

interface CaseWithPriority extends Caso {
  priority: Priority;
  horasParaVencimiento?: number;
}

const AlertasCriticas: React.FC = () => {
  const [criticos, setCriticos] = useState<CaseWithPriority[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await api.getCases();
      const filtered = list.filter(c => 
        c.diasAbierto >= c.categoria.slaDias || 
        c.status === CaseStatus.ESCALADO ||
        (c.categoria.slaDias - c.diasAbierto <= 1 && c.diasAbierto > 0)
      );
      
      const prioritized = prioritizeCases(filtered);
      setCriticos(prioritized);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading critical cases:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000); // Actualizar cada minuto
    return () => clearInterval(interval);
  }, []);

  // Priorización automática: Escalados > Fuera SLA > En proceso
  const prioritizeCases = (cases: Caso[]): CaseWithPriority[] => {
    return cases.map(caso => {
      let priority: Priority = 'Media';
      
      if (caso.status === CaseStatus.ESCALADO) {
        priority = 'Critica';
      } else if (caso.diasAbierto >= caso.categoria.slaDias) {
        priority = 'Alta';
      } else if (caso.status === CaseStatus.EN_PROCESO) {
        priority = 'Alta';
      }

      const diasRestantes = caso.categoria.slaDias - caso.diasAbierto;
      const horasParaVencimiento = diasRestantes > 0 ? diasRestantes * 24 : 0;

      return {
        ...caso,
        priority,
        horasParaVencimiento
      };
    }).sort((a, b) => {
      const priorityOrder: Record<Priority, number> = { Critica: 3, Alta: 2, Media: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.diasAbierto - a.diasAbierto;
    });
  };

  const getTimeStatus = (dias: number) => {
    if (dias >= 5) return { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', label: 'Crítico' };
    if (dias >= 3) return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Alto' };
    if (dias >= 1) return { color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Medio' };
    return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Bajo' };
  };

  const getPriorityBadge = (priority: Priority) => {
    const styles = {
      Critica: 'bg-orange-600 text-white border-orange-700',
      Alta: 'bg-amber-500 text-amber-900 border-amber-600',
      Media: 'bg-slate-400 text-white border-slate-500'
    };
    return (
      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md border ${styles[priority]} uppercase tracking-tight`}>
        {priority}
      </span>
    );
  };

  const getAgentStats = (agenteId: string, agentName: string, casos: CaseWithPriority[]) => {
    const agentCases = casos.filter(c => 
      c.agenteAsignado?.idAgente === agenteId || 
      c.agentId === agenteId ||
      c.agentName === agentName
    );
    const criticos = agentCases.filter(c => c.priority === 'Critica' || c.priority === 'Alta').length;
    const cumplimiento = agentCases.length > 0 
      ? Math.round((agentCases.filter(c => !c.slaExpired).length / agentCases.length) * 100)
      : 100;
    
    return { activos: agentCases.length, criticos, cumplimiento };
  };

  const casosFueraSLA = criticos.filter(c => c.diasAbierto >= c.categoria.slaDias).length;
  const casosVencen24h = criticos.filter(c => 
    c.horasParaVencimiento !== undefined && 
    c.horasParaVencimiento > 0 && 
    c.horasParaVencimiento <= 24
  ).length;

  const getMinutesAgo = () => {
    const diff = Math.floor((new Date().getTime() - lastUpdate.getTime()) / 1000 / 60);
    if (diff < 1) return 'Ahora';
    if (diff === 1) return '1 minuto';
    return `${diff} minutos`;
  };

  const handleQuickAction = (e: React.MouseEvent, action: string, casoId: string) => {
    e.stopPropagation();
    // Preparado para acciones futuras
    console.log(`Action: ${action}, Case: ${casoId}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-slate-50 via-orange-50/30 to-slate-50 border-2 border-slate-200 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-slate-200 rounded-xl animate-pulse"></div>
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-slate-200 rounded w-64 animate-pulse"></div>
            <div className="h-4 bg-slate-200 rounded w-48 animate-pulse"></div>
          </div>
          <div className="w-16 h-16 bg-slate-200 rounded-xl animate-pulse"></div>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white p-6 rounded-2xl border-2 border-slate-200 animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner de Monitoreo Compacto */}
      <div className="bg-gradient-to-r from-slate-50 via-orange-50/30 to-slate-50 border-2 border-slate-200 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
        <div className="w-12 h-12 bg-slate-800 text-white rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold mb-1 text-slate-800">
            Monitoreo de SLA en Tiempo Real
          </h3>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-semibold text-orange-600">
              <AnimatedNumber value={casosFueraSLA} /> fuera de SLA
            </span>
            <span className="text-slate-400">•</span>
            <span className="font-semibold text-amber-600">
              <AnimatedNumber value={casosVencen24h} /> vencen en &lt;24h
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="bg-white px-3 py-1.5 rounded-lg border-2 border-slate-200">
            <p className="text-[10px] font-bold tracking-tight mb-0.5 text-slate-500">Total</p>
            <p className="text-xl font-bold text-slate-800">
              <AnimatedNumber value={criticos.length} />
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Circle className={`w-2 h-2 ${getMinutesAgo() === 'Ahora' ? 'fill-green-500 text-green-500' : 'fill-amber-500 text-amber-500'}`} />
            <span className="font-medium">Actualizado hace {getMinutesAgo()}</span>
          </div>
        </div>
      </div>

      {/* Lista de Casos Priorizados */}
      <div className="grid gap-4">
        {criticos.length > 0 ? criticos.map((caso, idx) => {
          const timeStatus = getTimeStatus(caso.diasAbierto);
          const borderColor = caso.priority === 'Critica' 
            ? '#ea580c' // orange-600
            : caso.priority === 'Alta' 
            ? '#f59e0b' // amber-500
            : '#94a3b8'; // slate-400

          return (
            <div 
              key={caso.id}
              onClick={() => navigate(`/app/casos/${caso.id}`)}
              className="bg-white p-5 rounded-2xl border-2 border-slate-200/50 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-200 cursor-pointer group border-l-4"
              style={{
                borderLeftColor: borderColor,
                animationDelay: `${idx * 30}ms`
              }}
            >
              <div className="flex items-start gap-4">
                {/* Indicador de Severidad */}
                <div className={`mt-1 p-2.5 rounded-xl border ${timeStatus.bg} ${timeStatus.border} flex-shrink-0`}>
                  <AlertTriangle className={`w-5 h-5 ${timeStatus.color}`} />
                </div>

                {/* Contenido Principal */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-base font-bold text-slate-900">{caso.ticketNumber || caso.id}</span>
                    {getPriorityBadge(caso.priority)}
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm ${STATE_COLORS[caso.status]}`}>
                      {caso.status}
                    </span>
                    {caso.diasAbierto >= caso.categoria.slaDias && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-orange-600 text-white rounded border border-orange-700 uppercase">
                        SLA Vencido
                      </span>
                    )}
                  </div>
                  
                  <h4 className="font-semibold text-slate-900 text-lg mb-2 truncate">{caso.subject}</h4>
                  
                  <div className="flex items-center gap-4 flex-wrap text-sm">
                    <span className="text-slate-600">
                      Cliente: <span className="font-bold text-slate-800">{caso.clientName}</span>
                    </span>
                    
                    {/* Semáforo Visual de Tiempo */}
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${timeStatus.bg} ${timeStatus.border}`}>
                      <Clock className={`w-4 h-4 ${timeStatus.color}`} />
                      <span className={`text-sm font-bold ${timeStatus.color}`}>
                        {caso.diasAbierto} días
                      </span>
                      <span className={`text-[10px] font-semibold ${timeStatus.color} uppercase`}>
                        {timeStatus.label}
                      </span>
                    </div>
                  </div>

                  {/* Información del Agente Enriquecida */}
                  {(caso.agenteAsignado || caso.agentName) && (() => {
                    const agentName = caso.agenteAsignado?.nombre || caso.agentName || 'Sin asignar';
                    const agentId = caso.agenteAsignado?.idAgente || caso.agentId || '';
                    const agentStats = getAgentStats(agentId, agentName, criticos);
                    
                    return (
                      <div className="mt-3 flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {agentName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{agentName}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs">
                            <span className="text-slate-600">
                              <span className="font-bold text-slate-800">{agentStats.activos}</span> activos
                            </span>
                            {agentStats.criticos > 0 && (
                              <span className="text-orange-600">
                                <span className="font-bold">{agentStats.criticos}</span> críticos
                              </span>
                            )}
                            <span className={`font-bold ${agentStats.cumplimiento >= 80 ? 'text-green-600' : agentStats.cumplimiento >= 60 ? 'text-amber-600' : 'text-orange-600'}`}>
                              {agentStats.cumplimiento}% SLA
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Acciones Rápidas Visibles */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={(e) => handleQuickAction(e, 'reasignar', caso.id)}
                    className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all group/btn"
                    title="Reasignar caso"
                  >
                    <Users className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleQuickAction(e, 'escalar', caso.id)}
                    className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all group/btn"
                    title="Escalar caso"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleQuickAction(e, 'notificar', caso.id)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all group/btn"
                    title="Notificar agente"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/app/casos/${caso.id}`);
                    }}
                    className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all group/btn"
                    title="Ver detalle"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="bg-white p-16 text-center rounded-2xl border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No hay alertas críticas</h3>
            <p className="text-slate-500 font-medium mb-4">Todos los casos están bajo control y dentro del SLA.</p>
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertasCriticas;
