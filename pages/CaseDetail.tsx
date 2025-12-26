import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Case, CaseStatus } from '../types';
import { STATE_TRANSITIONS, STATE_COLORS } from '../constants';
import { 
  ArrowLeft, MessageSquare, User, Building2, Phone, Mail, CheckCircle2, 
  AlertTriangle, Clock, X, Lock, Send, Paperclip, History, TrendingUp,
  UserCheck, ArrowUpRight, FileText, Calendar, Zap, Shield
} from 'lucide-react';

interface TimelineEvent {
  fechaHora: string;
  tipo: 'creacion' | 'asignacion' | 'cambio_estado' | 'escalamiento' | 'comentario' | 'resolucion';
  titulo: string;
  detalle: string;
  usuario?: string;
}

interface Comment {
  id: string;
  fechaHora: string;
  usuario: string;
  texto: string;
  interno: boolean;
  adjuntos?: string[];
}

const CaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [caso, setCaso] = useState<Case | null>(null);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(true);
  const [showResueltoModal, setShowResueltoModal] = useState(false);
  const [showPendienteModal, setShowPendienteModal] = useState(false);
  const [showEscalarModal, setShowEscalarModal] = useState(false);
  const [showCerrarModal, setShowCerrarModal] = useState(false);
  const [showReasignarModal, setShowReasignarModal] = useState(false);
  const [formDetail, setFormDetail] = useState('');
  const headerRef = useRef<HTMLDivElement>(null);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);

  useEffect(() => {
    if (id) loadCaso(id);
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        const rect = headerRef.current.getBoundingClientRect();
        setIsHeaderSticky(rect.top <= 0);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadCaso = async (caseId: string) => {
    const data = await api.getCasoById(caseId);
    if (data) {
      setCaso(data);
      // Generar timeline desde historial
      if (data.history && Array.isArray(data.history)) {
        // Los eventos ya vienen del historial
      }
    }
  };

  const handleStateChange = async (newState: string, extraData?: any) => {
    if (!caso) return;
    setTransitionLoading(true);
    try {
      await api.updateCaseStatus(caso.id, newState, `Transición a ${newState}`, extraData);
      setShowResueltoModal(false);
      setShowPendienteModal(false);
      setShowEscalarModal(false);
      setShowCerrarModal(false);
      setShowReasignarModal(false);
      setFormDetail('');
      await loadCaso(caso.id);
    } catch (err) {
      alert('Error al actualizar el estado del caso.');
    } finally {
      setTransitionLoading(false);
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !caso) return;
    const comment: Comment = {
      id: Date.now().toString(),
      fechaHora: new Date().toISOString(),
      usuario: api.getUser()?.name || 'Usuario',
      texto: newComment,
      interno: isInternalComment
    };
    setComments([comment, ...comments]);
    setNewComment('');
  };

  const calculateSLAData = () => {
    if (!caso || !caso.categoria) return null;
    
    const createdAt = new Date(caso.createdAt);
    const now = new Date();
    const slaHours = caso.categoria.slaDias * 24;
    const elapsedHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    const progressPercent = Math.min(100, (elapsedHours / slaHours) * 100);
    const isOverdue = elapsedHours > slaHours;
    const overdueHours = isOverdue ? Math.floor(elapsedHours - slaHours) : 0;

    return {
      slaHours,
      elapsedHours: Math.floor(elapsedHours),
      progressPercent: Math.min(100, progressPercent),
      isOverdue,
      overdueHours,
      remainingHours: Math.max(0, Math.floor(slaHours - elapsedHours))
    };
  };

  const generateTimelineEvents = (): TimelineEvent[] => {
    if (!caso) return [];
    const events: TimelineEvent[] = [];

    // Evento de creación
    events.push({
      fechaHora: caso.createdAt,
      tipo: 'creacion',
      titulo: 'Caso creado',
      detalle: `Caso ${caso.ticketNumber} fue creado`,
      usuario: 'Sistema'
    });

    // Eventos del historial
    if (caso.history && Array.isArray(caso.history)) {
      caso.history.forEach((h: any) => {
        let tipo: TimelineEvent['tipo'] = 'comentario';
        let titulo = 'Comentario';

        if (h.detalle?.includes('asignado') || h.detalle?.includes('Asignado')) {
          tipo = 'asignacion';
          titulo = 'Asignación';
        } else if (h.detalle?.includes('Escalado') || h.detalle?.includes('escalado')) {
          tipo = 'escalamiento';
          titulo = 'Escalamiento';
        } else if (h.detalle?.includes('Cambio de estado') || h.detalle?.includes('Transición')) {
          tipo = 'cambio_estado';
          titulo = 'Cambio de estado';
        } else if (h.detalle?.includes('Resuelto') || h.detalle?.includes('resolución')) {
          tipo = 'resolucion';
          titulo = 'Resolución';
        }

        events.push({
          fechaHora: h.fechaHora || h.fecha || new Date().toISOString(),
          tipo,
          titulo,
          detalle: h.detalle || h.texto || '',
          usuario: h.usuario || 'Sistema'
        });
      });
    }

    return events.sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());
  };

  if (!caso) return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{borderColor: 'var(--color-accent-blue)'}}></div>
        <p className="text-slate-400 font-medium tracking-normal text-xs">Cargando Detalle...</p>
      </div>
    </div>
  );

  const validTransitions = STATE_TRANSITIONS[caso.status as CaseStatus] || [];
  const slaData = calculateSLAData();
  const timelineEvents = generateTimelineEvents();
  const isCritical = caso.status === CaseStatus.ESCALADO || caso.slaExpired;
  const isEscalado = caso.status === CaseStatus.ESCALADO;
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeAgo = (hours: number) => {
    if (hours < 24) return `${hours} hora${hours !== 1 ? 's' : ''}`;
    const days = Math.floor(hours / 24);
    return `${days} día${days !== 1 ? 's' : ''}`;
  };

  const stateTransitionActions = {
    cambiarEstado: validTransitions.filter(st => 
      ![CaseStatus.ESCALADO, CaseStatus.CERRADO].includes(st as CaseStatus)
    ),
    escalar: caso.status !== CaseStatus.ESCALADO && caso.status !== CaseStatus.CERRADO,
    reasignar: caso.status !== CaseStatus.CERRADO,
    cerrar: caso.status === CaseStatus.RESUELTO
  };

  return (
    <div className="max-w-6xl mx-auto" style={{ paddingBottom: '2rem' }}>
      <div 
        ref={headerRef}
        className={`sticky top-0 z-40 bg-white transition-all ${isHeaderSticky ? 'shadow-md border-b-2 border-slate-200' : ''}`}
        style={{ 
          marginLeft: '-2rem', 
          marginRight: '-2rem', 
          paddingLeft: '2rem', 
          paddingRight: '2rem',
          paddingTop: isHeaderSticky ? '1rem' : '0',
          paddingBottom: isHeaderSticky ? '1rem' : '0'
        }}
      >
        <button 
          onClick={() => navigate(-1)}
          className={`flex items-center text-slate-600 hover:text-slate-900 font-bold transition-colors mb-4 group px-4 py-2 rounded-xl hover:bg-slate-100 ${isHeaderSticky ? '' : 'mb-2'}`}
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" /> Volver
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Encabezado del caso */}
          <section 
            className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden transition-all ${
              isCritical ? 'border-red-300 shadow-red-100/50' : 'border-slate-200/50'
            }`}
            style={isCritical ? { borderTop: '4px solid #dc2626' } : {}}
          >
            {isCritical && (
              <div className="bg-red-50 border-b-2 border-red-200 px-8 py-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <p className="text-sm font-semibold text-red-700">
                    {isEscalado && caso.slaExpired && 'Caso escalado y SLA vencido'}
                    {isEscalado && !caso.slaExpired && 'Caso escalado - Requiere atención inmediata'}
                    {!isEscalado && caso.slaExpired && slaData && `SLA vencido hace ${formatTimeAgo(slaData.overdueHours)}`}
                  </p>
                </div>
              </div>
            )}

            <div className="p-8 border-b-2 border-slate-100 bg-gradient-to-r from-slate-50 to-white flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <span className="text-4xl font-semibold text-slate-900 tracking-tight">{caso.ticketNumber}</span>
                  <span className={`px-4 py-2 rounded-full text-xs font-semibold border-2 shadow-sm ${STATE_COLORS[caso.status as CaseStatus]}`}>
                    {caso.status}
                  </span>
                </div>
                <h1 className="text-2xl font-semibold text-slate-900 leading-tight">{caso.subject}</h1>
              </div>
            </div>

            {/* Información de SLA ampliada */}
            {slaData && (
              <div className="p-8 border-b-2 border-slate-100 bg-gradient-to-r from-slate-50/50 to-white">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5" style={{color: 'var(--color-accent-blue)'}} />
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Información SLA</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-500 font-medium mb-1">SLA Comprometido</p>
                    <p className="text-lg font-bold text-slate-900">{slaData.slaHours}h ({caso.categoria?.slaDias || 0} días)</p>
                  </div>
                  <div className={`p-4 rounded-xl border ${slaData.isOverdue ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
                    <p className="text-xs font-medium mb-1" style={slaData.isOverdue ? {color: '#991b1b'} : {color: '#64748b'}}>
                      Tiempo Transcurrido
                    </p>
                    <p className={`text-lg font-bold ${slaData.isOverdue ? 'text-red-700' : 'text-slate-900'}`}>
                      {slaData.elapsedHours}h ({Math.floor(slaData.elapsedHours / 24)} días)
                    </p>
                  </div>
                </div>

                {/* Barra de progreso SLA */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-medium">
                    <span className={slaData.isOverdue ? 'text-red-600' : 'text-slate-600'}>
                      {slaData.isOverdue ? `Excedido: +${formatTimeAgo(slaData.overdueHours)}` : `Restante: ${formatTimeAgo(slaData.remainingHours)}`}
                    </span>
                    <span className={slaData.isOverdue ? 'text-red-600 font-bold' : 'text-slate-600'}>
                      {slaData.progressPercent.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        slaData.isOverdue 
                          ? 'bg-gradient-to-r from-red-500 to-red-600' 
                          : slaData.progressPercent > 80
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                          : 'bg-gradient-to-r from-green-500 to-green-600'
                      }`}
                      style={{ width: `${Math.min(100, slaData.progressPercent)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="p-8">
              <h3 className="text-sm font-semibold text-slate-700 tracking-normal mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" style={{color: 'var(--color-accent-blue)'}} /> Descripción del Caso
              </h3>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-6 rounded-2xl border-2 border-slate-200 text-slate-700 leading-relaxed font-medium shadow-sm">
                {caso.description}
              </div>
            </div>

            {/* Acciones reorganizadas por categorías */}
            <div className="p-8 border-t-2 border-slate-100 bg-gradient-to-r from-slate-50/30 to-slate-100/30">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-5 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" style={{color: 'var(--color-accent-blue)'}} /> Acciones Disponibles
              </h3>
              
              {/* Cambiar Estado */}
              {stateTransitionActions.cambiarEstado.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Cambiar Estado</p>
                  <div className="flex flex-wrap gap-3">
                    {stateTransitionActions.cambiarEstado.map(st => {
                      const onClick = () => {
                        if (st === CaseStatus.RESUELTO) setShowResueltoModal(true);
                        else if (st === CaseStatus.PENDIENTE_CLIENTE) setShowPendienteModal(true);
                        else handleStateChange(st);
                      };
                      
                      return (
                        <button
                          key={st}
                          disabled={transitionLoading}
                          onClick={onClick}
                          className="px-6 py-3 rounded-xl text-white text-xs font-semibold tracking-normal transition-all disabled:opacity-50 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                          style={{background: 'linear-gradient(to right, var(--color-brand-red), var(--color-accent-red))', boxShadow: '0 12px 30px rgba(200, 21, 27, 0.25)'}}
                          onMouseEnter={(e) => {
                            if (!e.currentTarget.disabled) {
                              e.currentTarget.style.background = 'linear-gradient(to right, var(--color-accent-red), var(--color-brand-red))';
                              e.currentTarget.style.boxShadow = '0 14px 34px rgba(245, 41, 56, 0.28)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(to right, var(--color-brand-red), var(--color-accent-red))';
                            e.currentTarget.style.boxShadow = '0 12px 30px rgba(200, 21, 27, 0.25)';
                          }}
                        >
                          {st}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Acciones de gestión */}
              <div className="grid grid-cols-2 gap-3">
                {stateTransitionActions.escalar && (
                  <button
                    onClick={() => setShowEscalarModal(true)}
                    disabled={transitionLoading || caso.status === CaseStatus.ESCALADO}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    Escalar
                  </button>
                )}
                
                {stateTransitionActions.reasignar && (
                  <button
                    onClick={() => setShowReasignarModal(true)}
                    disabled={transitionLoading}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 border-2 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
                  >
                    <UserCheck className="w-4 h-4" />
                    Reasignar
                  </button>
                )}

                {stateTransitionActions.cerrar && (
                  <button
                    onClick={() => setShowCerrarModal(true)}
                    disabled={transitionLoading}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 border-2 border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-300 col-span-2"
                  >
                    <Lock className="w-4 h-4" />
                    Cerrar Caso
                  </button>
                )}
              </div>

              {validTransitions.length === 0 && !stateTransitionActions.escalar && !stateTransitionActions.reasignar && !stateTransitionActions.cerrar && (
                <div className="w-full p-4 bg-slate-100 rounded-xl border border-slate-200">
                  <p className="text-slate-500 text-sm font-medium text-center">Caso en estado final ({caso.status}).</p>
                </div>
              )}
            </div>
          </section>

          {/* Timeline / Historial */}
          <section className="bg-white rounded-2xl shadow-sm border-2 border-slate-200/50 overflow-hidden">
            <div className="p-8 border-b-2 border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5" style={{color: 'var(--color-accent-blue)'}} />
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Historial del Caso</h3>
              </div>
            </div>
            
            <div className="p-8 max-h-96 overflow-y-auto">
              {timelineEvents.length > 0 ? (
                <div className="relative">
                  {/* Línea vertical del timeline */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200"></div>
                  
                  <div className="space-y-6">
                    {timelineEvents.map((event, idx) => {
                      const getEventIcon = () => {
                        switch (event.tipo) {
                          case 'creacion': return <Zap className="w-4 h-4 text-blue-600" />;
                          case 'asignacion': return <UserCheck className="w-4 h-4 text-green-600" />;
                          case 'cambio_estado': return <TrendingUp className="w-4 h-4 text-amber-600" />;
                          case 'escalamiento': return <AlertTriangle className="w-4 h-4 text-red-600" />;
                          case 'resolucion': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
                          default: return <MessageSquare className="w-4 h-4 text-slate-600" />;
                        }
                      };

                      return (
                        <div key={idx} className="relative flex gap-4">
                          {/* Icono del evento */}
                          <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shadow-sm">
                            {getEventIcon()}
                          </div>
                          
                          {/* Contenido del evento */}
                          <div className="flex-1 pb-6">
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-slate-900 text-sm">{event.titulo}</h4>
                                <span className="text-xs text-slate-500 font-medium">{formatDate(event.fechaHora)}</span>
                              </div>
                              <p className="text-sm text-slate-700 mb-1">{event.detalle}</p>
                              {event.usuario && (
                                <p className="text-xs text-slate-500 font-medium">Por: {event.usuario}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm font-medium">No hay eventos en el historial</p>
                </div>
              )}
            </div>
          </section>

          {/* Panel de comentarios */}
          <section className="bg-white rounded-2xl shadow-sm border-2 border-slate-200/50 overflow-hidden">
            <div className="p-8 border-b-2 border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" style={{color: 'var(--color-accent-blue)'}} />
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Comentarios y Notas</h3>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              {/* Lista de comentarios */}
              {comments.length > 0 ? (
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {comments.map(comment => (
                    <div key={comment.id} className={`p-4 rounded-xl border-2 ${comment.interno ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900">{comment.usuario}</span>
                          {comment.interno && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">Interno</span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500">{formatDate(comment.fechaHora)}</span>
                      </div>
                      <p className="text-sm text-slate-700">{comment.texto}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm font-medium">No hay comentarios aún</p>
                </div>
              )}

              {/* Formulario de nuevo comentario */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="internal-comment"
                    checked={isInternalComment}
                    onChange={(e) => setIsInternalComment(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <label htmlFor="internal-comment" className="text-sm font-medium text-slate-700">
                    Comentario interno (no visible para el cliente)
                  </label>
                </div>
                
                <div className="flex gap-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={isInternalComment ? "Agregar nota interna..." : "Agregar comentario para el cliente..."}
                    className="flex-1 p-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none text-sm"
                    rows={3}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Botón para adjuntos (UI only) */}
                <button className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">
                  <Paperclip className="w-4 h-4" />
                  <span>Adjuntar archivo</span>
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Columna derecha */}
        <div className="space-y-6">
          {/* Información del cliente */}
          <section className="bg-white rounded-2xl shadow-sm border-2 border-slate-200/50 p-6">
            <div className="flex items-center gap-2 mb-5">
              <Building2 className="w-5 h-5" style={{color: 'var(--color-accent-blue)'}} />
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">Información del Cliente</h3>
            </div>
            <p className="text-slate-900 font-semibold text-xl mb-5">{caso.clientName}</p>
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3 flex-1">
                  <Mail className="w-4 h-4 text-slate-500"/>
                  <p className="text-sm text-slate-700 font-medium">{caso.clientEmail}</p>
                </div>
                <a 
                  href={`mailto:${caso.clientEmail}`}
                  className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                  title="Enviar correo"
                >
                  <Send className="w-4 h-4 text-blue-600" />
                </a>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3 flex-1">
                  <Phone className="w-4 h-4 text-slate-500"/>
                  <p className="text-sm text-slate-700 font-medium">{caso.clientPhone}</p>
                </div>
                <a 
                  href={`tel:${caso.clientPhone}`}
                  className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                  title="Llamar"
                >
                  <Phone className="w-4 h-4 text-green-600" />
                </a>
              </div>
            </div>
            <button className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" />
              Ver historial del cliente
            </button>
          </section>

          {/* Agente asignado enriquecido */}
          <section className="bg-white rounded-2xl shadow-sm border-2 border-slate-200/50 p-6">
            <div className="flex items-center gap-2 mb-5">
              <User className="w-5 h-5 text-slate-600" />
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">Agente Asignado</h3>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold text-lg" style={{background: 'linear-gradient(135deg, var(--color-brand-red), var(--color-accent-red))', boxShadow: '0 12px 30px rgba(200, 21, 27, 0.25)'}}>
                {caso.agentName.charAt(0)}
              </div>
              <p className="text-base font-bold text-slate-800">{caso.agentName}</p>
            </div>
            
            {/* Métricas del agente */}
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-600 font-medium">Casos Activos</span>
                  <span className="text-lg font-bold text-slate-900">{caso.agenteAsignado?.casosActivos || 0}</span>
                </div>
              </div>
              <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-red-700 font-medium">Casos Críticos</span>
                  <span className="text-lg font-bold text-red-700">0</span>
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-green-700 font-medium">% Cumplimiento SLA</span>
                  <span className="text-lg font-bold text-green-700">95%</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Modal Resuelto */}
      {showResueltoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200/50 transform animate-in zoom-in-95 duration-200">
            <div className="p-6 text-white flex justify-between items-center" style={{background: 'linear-gradient(to right, var(--color-accent-blue-2), var(--color-accent-blue-3))'}}>
              <h3 className="font-semibold text-lg">Registrar Resolución</h3>
              <button 
                onClick={() => setShowResueltoModal(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6"/>
              </button>
            </div>
            <div className="p-8 space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-600 tracking-normal mb-2">Solución Brindada</label>
                <textarea 
                  className="w-full h-32 p-4 rounded-xl border-2 border-slate-200 outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all bg-slate-50 focus:bg-white font-medium resize-none"
                  placeholder="Describe la solución implementada..."
                  value={formDetail}
                  onChange={e => setFormDetail(e.target.value)}
                ></textarea>
              </div>
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowResueltoModal(false)}
                  className="flex-1 py-3.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all border border-slate-200"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => handleStateChange(CaseStatus.RESUELTO, { resolucion: formDetail })}
                  disabled={transitionLoading || !formDetail.trim()}
                  className="flex-1 py-3.5 text-white font-semibold rounded-xl transition-all shadow-lg disabled:opacity-50"
                  style={{background: 'linear-gradient(to right, var(--color-accent-blue-2), var(--color-accent-blue-3))'}}
                >
                  {transitionLoading ? 'Procesando...' : 'Confirmar Resolución'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pendiente Cliente */}
      {showPendienteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200/50">
            <div className="p-6 text-white flex justify-between items-center" style={{background: 'linear-gradient(to right, var(--color-accent-blue-2), var(--color-accent-blue-3))'}}>
              <h3 className="font-semibold text-lg">Cambiar a Pendiente Cliente</h3>
              <button onClick={() => setShowPendienteModal(false)} className="p-1 hover:bg-white/20 rounded-lg">
                <X className="w-6 h-6"/>
              </button>
            </div>
            <div className="p-8 space-y-5">
              <p className="text-sm text-slate-700">¿Estás seguro de cambiar el estado a "Pendiente Cliente"?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowPendienteModal(false)} className="flex-1 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200">
                  Cancelar
                </button>
                <button 
                  onClick={() => handleStateChange(CaseStatus.PENDIENTE_CLIENTE)}
                  className="flex-1 py-3 text-white font-semibold rounded-xl" 
                  style={{background: 'linear-gradient(to right, var(--color-brand-red), var(--color-accent-red))'}}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Escalar */}
      {showEscalarModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200/50">
            <div className="p-6 text-white flex justify-between items-center bg-gradient-to-r from-amber-600 to-amber-700">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="font-semibold text-lg">Escalar Caso</h3>
              </div>
              <button onClick={() => setShowEscalarModal(false)} className="p-1 hover:bg-white/20 rounded-lg">
                <X className="w-6 h-6"/>
              </button>
            </div>
            <div className="p-8 space-y-5">
              <p className="text-sm text-slate-700">¿Estás seguro de escalar este caso? Esta acción requiere atención inmediata del supervisor.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowEscalarModal(false)} className="flex-1 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200">
                  Cancelar
                </button>
                <button 
                  onClick={() => handleStateChange(CaseStatus.ESCALADO)}
                  className="flex-1 py-3 text-white font-semibold rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800"
                >
                  Confirmar Escalamiento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cerrar */}
      {showCerrarModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200/50">
            <div className="p-6 text-white flex justify-between items-center bg-gradient-to-r from-green-600 to-green-700">
              <div className="flex items-center gap-2">
                <Lock className="w-6 h-6" />
                <h3 className="font-semibold text-lg">Cerrar Caso</h3>
              </div>
              <button onClick={() => setShowCerrarModal(false)} className="p-1 hover:bg-white/20 rounded-lg">
                <X className="w-6 h-6"/>
              </button>
            </div>
            <div className="p-8 space-y-5">
              <p className="text-sm text-slate-700">¿Estás seguro de cerrar este caso? Esta acción no se puede deshacer.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowCerrarModal(false)} className="flex-1 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200">
                  Cancelar
                </button>
                <button 
                  onClick={() => handleStateChange(CaseStatus.CERRADO)}
                  className="flex-1 py-3 text-white font-semibold rounded-xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                >
                  Confirmar Cierre
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reasignar */}
      {showReasignarModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200/50">
            <div className="p-6 text-white flex justify-between items-center bg-gradient-to-r from-blue-600 to-blue-700">
              <h3 className="font-semibold text-lg">Reasignar Agente</h3>
              <button onClick={() => setShowReasignarModal(false)} className="p-1 hover:bg-white/20 rounded-lg">
                <X className="w-6 h-6"/>
              </button>
            </div>
            <div className="p-8 space-y-5">
              <p className="text-sm text-slate-700">Funcionalidad de reasignación próximamente disponible.</p>
              <button onClick={() => setShowReasignarModal(false)} className="w-full py-3 text-white font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-blue-700">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseDetail;
