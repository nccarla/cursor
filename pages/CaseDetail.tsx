
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Case, CaseStatus } from '../types';
import { STATE_TRANSITIONS, STATE_COLORS } from '../constants';
import { ArrowLeft, MessageSquare, History, User, Building2, Phone, Mail, Send, CheckCircle2, AlertTriangle, Clock, X } from 'lucide-react';

const CaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [caso, setCaso] = useState<Case | null>(null);
  const [transitionLoading, setTransitionLoading] = useState(false);
  
  const [showResueltoModal, setShowResueltoModal] = useState(false);
  const [showPendienteModal, setShowPendienteModal] = useState(false);
  const [formDetail, setFormDetail] = useState('');

  useEffect(() => {
    if (id) loadCaso(id);
  }, [id]);

  const loadCaso = async (caseId: string) => {
    const data = await api.getCasoById(caseId);
    if (data) setCaso(data);
  };

  const handleStateChange = async (newState: string, extraData?: any) => {
    if (!caso) return;
    setTransitionLoading(true);
    try {
      await api.updateCaseStatus(caso.id, newState, `Transición a ${newState}`, extraData);
      setShowResueltoModal(false);
      setShowPendienteModal(false);
      setFormDetail('');
      await loadCaso(caso.id);
    } catch (err) {
      alert('Error al actualizar el estado del caso.');
    } finally {
      setTransitionLoading(false);
    }
  };

  if (!caso) return (
    <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{borderColor: 'var(--color-accent-blue)'}}></div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando Detalle...</p>
        </div>
    </div>
  );

  const validTransitions = STATE_TRANSITIONS[caso.status as CaseStatus] || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-slate-600 hover:text-slate-900 font-bold transition-colors mb-2 group px-4 py-2 rounded-xl hover:bg-slate-100"
      >
        <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" /> Volver
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-2xl shadow-sm border-2 border-slate-200/50 overflow-hidden">
            <div className="p-8 border-b-2 border-slate-100 bg-gradient-to-r from-slate-50 to-white flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <span className="text-4xl font-black text-slate-900 tracking-tighter">{caso.ticketNumber}</span>
                  <span className={`px-4 py-2 rounded-full text-xs font-black uppercase border-2 shadow-sm ${STATE_COLORS[caso.status as CaseStatus]}`}>
                    {caso.status}
                  </span>
                </div>
                <h1 className="text-2xl font-black text-slate-900 leading-tight">{caso.subject}</h1>
              </div>
              <div className="text-right ml-4">
                <p className="text-[10px] text-slate-500 uppercase font-black mb-2">Estado SLA</p>
                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 shadow-sm ${caso.slaExpired ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                  <Clock className={`w-5 h-5 ${caso.slaExpired ? 'text-red-600' : 'text-green-600'}`} />
                  <span className="text-lg font-black">{caso.slaExpired ? 'Vencido' : 'En tiempo'}</span>
                </div>
              </div>
            </div>

            <div className="p-8">
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" style={{color: 'var(--color-accent-blue)'}} /> Descripción del Caso
              </h3>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-6 rounded-2xl border-2 border-slate-200 text-slate-700 leading-relaxed font-medium shadow-sm">
                {caso.description}
              </div>
            </div>

            <div className="p-8 border-t-2 border-slate-100 bg-gradient-to-r from-blue-50/30 to-indigo-50/30">
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-5 flex items-center gap-2">
                 <CheckCircle2 className="w-5 h-5" style={{color: 'var(--color-accent-blue)'}} /> Acciones Disponibles
               </h3>
               <div className="flex flex-wrap gap-3">
                 {validTransitions.length > 0 ? (
                   validTransitions.map(st => {
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
                          className="px-6 py-3 rounded-xl bg-gradient-brand-blue text-white text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                          style={{background: 'linear-gradient(to right, var(--color-accent-blue), var(--color-accent-blue-2))'}}
                          onMouseEnter={(e) => {
                            if (!e.currentTarget.disabled) {
                              e.currentTarget.style.background = 'linear-gradient(to right, var(--color-brand-blue), var(--color-accent-blue))';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(to right, var(--color-accent-blue), var(--color-accent-blue-2))';
                          }}
                        >
                          {st}
                        </button>
                     );
                   })
                 ) : (
                   <div className="w-full p-4 bg-slate-100 rounded-xl border border-slate-200">
                     <p className="text-slate-500 text-sm font-medium text-center">Caso en estado final ({caso.status}).</p>
                   </div>
                 )}
               </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border-2 border-slate-200/50 p-8">
            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <History className="w-5 h-5" style={{color: 'var(--color-accent-blue)'}} />
              </div>
              Línea de Tiempo
            </h3>
            <div className="space-y-6 relative before:absolute before:left-[19px] before:top-3 before:bottom-3 before:w-1 before:bg-gradient-to-b before:from-blue-200 before:to-blue-100 before:rounded-full">
              {caso.history?.map((entry, idx) => (
                <div key={idx} className="relative pl-12">
                  <div className="absolute left-0 top-2 w-10 h-10 rounded-xl bg-gradient-brand-blue border-4 border-white flex items-center justify-center shadow-brand-blue-lg">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-sm hover:shadow-md transition-all hover:border-blue-200">
                    <p className="text-xs text-slate-500 font-black mb-2 uppercase tracking-wider">{new Date(entry.fechaHora).toLocaleString()}</p>
                    <p className="text-sm text-slate-800 font-semibold leading-relaxed mb-2">{entry.detalle}</p>
                    <p className="text-[10px] font-black uppercase tracking-wider" style={{color: 'var(--color-accent-blue)'}}>Por: {entry.usuario}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-2xl shadow-sm border-2 border-slate-200/50 p-6">
            <div className="flex items-center gap-2 mb-5">
              <Building2 className="w-5 h-5" style={{color: 'var(--color-accent-blue)'}} />
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">Información del Cliente</h3>
            </div>
            <p className="text-slate-900 font-black text-xl mb-5">{caso.clientName}</p>
            <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <Mail className="w-4 h-4 text-slate-500"/>
                  <p className="text-sm text-slate-700 font-medium">{caso.clientEmail}</p>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <Phone className="w-4 h-4 text-slate-500"/>
                  <p className="text-sm text-slate-700 font-medium">{caso.clientPhone}</p>
                </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border-2 border-slate-200/50 p-6">
            <div className="flex items-center gap-2 mb-5">
              <User className="w-5 h-5 text-blue-500" />
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">Agente Asignado</h3>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <div className="w-12 h-12 rounded-xl bg-gradient-brand-blue flex items-center justify-center text-white font-black text-lg shadow-brand-blue-lg">
                {caso.agentName.charAt(0)}
              </div>
              <p className="text-base font-bold text-slate-800">{caso.agentName}</p>
            </div>
          </section>
        </div>
      </div>

      {showResueltoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200/50 transform animate-in zoom-in-95 duration-200">
                <div className="p-6 text-white flex justify-between items-center" style={{background: 'linear-gradient(to right, var(--color-accent-blue-2), var(--color-accent-blue-3))'}}>
                    <h3 className="font-black uppercase text-lg">Registrar Resolución</h3>
                    <button 
                      onClick={() => setShowResueltoModal(false)}
                      className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X className="w-6 h-6"/>
                    </button>
                </div>
                <div className="p-8 space-y-5">
                    <div>
                      <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-2">Solución Brindada</label>
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
                        className="flex-1 py-3.5 text-white font-black rounded-xl transition-all shadow-lg disabled:opacity-50"
                        style={{background: 'linear-gradient(to right, var(--color-accent-blue-2), var(--color-accent-blue-3))'}}
                        onMouseEnter={(e) => {
                          if (!e.currentTarget.disabled) {
                            e.currentTarget.style.background = 'linear-gradient(to right, var(--color-accent-blue), var(--color-accent-blue-2))';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(to right, var(--color-accent-blue-2), var(--color-accent-blue-3))';
                        }}
                      >
                        {transitionLoading ? 'Procesando...' : 'Confirmar Resolución'}
                      </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default CaseDetail;
