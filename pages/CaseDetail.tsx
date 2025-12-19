
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
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando Detalle...</p>
        </div>
    </div>
  );

  const validTransitions = STATE_TRANSITIONS[caso.status as CaseStatus] || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-slate-500 hover:text-slate-800 font-bold transition-colors mb-4 group"
      >
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Volver
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl font-black text-slate-900 tracking-tighter">{caso.ticketNumber}</span>
                  <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase border ${STATE_COLORS[caso.status as CaseStatus]}`}>
                    {caso.status}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-slate-800">{caso.subject}</h1>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase font-black mb-1">SLA</p>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${caso.slaExpired ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                  <Clock className="w-4 h-4" />
                  <span className="text-xl font-black">{caso.slaExpired ? 'Vencido' : 'En tiempo'}</span>
                </div>
              </div>
            </div>

            <div className="p-8">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Descripción
              </h3>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-slate-700 leading-relaxed">
                {caso.description}
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/30">
               <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">Acciones</h3>
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
                          className="px-6 py-3 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50"
                        >
                          {st}
                        </button>
                     );
                   })
                 ) : (
                   <p className="text-slate-400 italic text-sm">Caso en estado final ({caso.status}).</p>
                 )}
               </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-2">
              <History className="w-5 h-5 text-blue-500" /> Línea de Tiempo
            </h3>
            <div className="space-y-8 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {caso.history?.map((entry, idx) => (
                <div key={idx} className="relative pl-10">
                  <div className="absolute left-0 top-1.5 w-8 h-8 rounded-xl bg-blue-500 border-4 border-white flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <p className="text-xs text-slate-400 font-bold mb-1">{new Date(entry.fechaHora).toLocaleString()}</p>
                    <p className="text-sm text-slate-700 font-medium">{entry.detalle}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mt-2">Por: {entry.usuario}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-xs font-black text-slate-400 uppercase mb-4">Cliente</h3>
            <p className="text-slate-900 font-black text-lg mb-4">{caso.clientName}</p>
            <div className="space-y-2">
                <p className="flex items-center gap-2 text-xs text-slate-600"><Mail className="w-3 h-3"/> {caso.clientEmail}</p>
                <p className="flex items-center gap-2 text-xs text-slate-600"><Phone className="w-3 h-3"/> {caso.clientPhone}</p>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-xs font-black text-slate-400 uppercase mb-4">Agente Asignado</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">{caso.agentName.charAt(0)}</div>
              <p className="text-sm font-bold text-slate-800">{caso.agentName}</p>
            </div>
          </section>
        </div>
      </div>

      {showResueltoModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden">
                <div className="p-6 bg-green-600 text-white flex justify-between items-center">
                    <h3 className="font-black uppercase">Registrar Resolución</h3>
                    <button onClick={() => setShowResueltoModal(false)}><X className="w-6 h-6"/></button>
                </div>
                <div className="p-8 space-y-4">
                    <textarea 
                        className="w-full h-32 p-4 rounded-xl border outline-none"
                        placeholder="Solución brindada..."
                        value={formDetail}
                        onChange={e => setFormDetail(e.target.value)}
                    ></textarea>
                    <button 
                        onClick={() => handleStateChange(CaseStatus.RESUELTO, { resolucion: formDetail })}
                        className="w-full py-4 bg-green-600 text-white font-black rounded-xl"
                    >Confirmar</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default CaseDetail;
