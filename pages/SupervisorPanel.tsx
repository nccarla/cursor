
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Caso, CaseStatus } from '../types';
import { STATE_COLORS } from '../constants';
import { AlertCircle, Clock, Users, ArrowUpRight, ChevronRight, Activity } from 'lucide-react';

const SupervisorPanel: React.FC = () => {
  const [casos, setCasos] = useState<Caso[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.getCases().then(setCasos);
  }, []);

  const casosAbiertos = casos.filter(c => c.status !== CaseStatus.CERRADO && c.status !== CaseStatus.RESUELTO);
  const casosCriticos = casosAbiertos.filter(c => c.diasAbierto >= c.categoria.slaDias || c.status === CaseStatus.ESCALADO);
  
  const stats = [
    { label: 'Casos Abiertos', value: casosAbiertos.length, icon: Activity, color: 'var(--color-accent-blue)', bg: 'rgba(16, 122, 180, 0.1)' },
    { label: 'Casos Críticos', value: casosCriticos.length, icon: AlertCircle, color: 'var(--color-brand-red)', bg: 'rgba(200, 21, 27, 0.1)' },
    { label: 'SLA Promedio', value: '92%', icon: Clock, color: 'var(--color-accent-blue-2)', bg: 'rgba(64, 154, 187, 0.1)' },
    { label: 'Agentes Online', value: '4/5', icon: Users, color: 'var(--color-accent-blue-3)', bg: 'rgba(123, 185, 203, 0.1)' },
  ];

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div 
            key={idx} 
            className="bg-white p-6 rounded-2xl border border-slate-200/50 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between group hover:-translate-y-1"
          >
            <div className="flex-1">
              <p className="text-xs font-black text-accent-gray uppercase tracking-wider mb-2">{stat.label}</p>
              <h3 className="text-3xl font-black group-hover:scale-105 transition-transform" style={{color: stat.color}}>{stat.value}</h3>
            </div>
            <div className="p-4 rounded-xl group-hover:scale-110 transition-transform shadow-sm" style={{backgroundColor: stat.bg}}>
              <stat.icon className="w-6 h-6" style={{color: stat.color}} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Critical Cases List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center p-4 rounded-2xl border-2" style={{background: 'linear-gradient(to right, rgba(200, 21, 27, 0.1), rgba(245, 41, 56, 0.1))', borderColor: 'rgba(200, 21, 27, 0.2)'}}>
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-brand-red rounded-xl shadow-brand-red-lg">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              Casos Críticos / Escalamientos
            </h3>
            <button 
              onClick={() => navigate('/app/casos')}
              className="text-sm font-bold flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/50 transition-all"
              style={{color: 'var(--color-accent-blue)'}}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-brand-blue)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-accent-blue)'}
            >
              Ver todos <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {casosCriticos.length > 0 ? (
                casosCriticos.map(caso => (
                  <div 
                    key={caso.id} 
                    onClick={() => navigate(`/app/casos/${caso.id}`)}
                    className="p-5 transition-all duration-200 cursor-pointer flex items-center justify-between group border-l-4 border-transparent"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(200, 21, 27, 0.05)';
                      e.currentTarget.style.borderLeftColor = 'var(--color-brand-red)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '';
                      e.currentTarget.style.borderLeftColor = 'transparent';
                    }}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-1.5 h-12 bg-gradient-to-b from-red-500 to-red-600 rounded-full shadow-sm"></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-black text-slate-900 transition-colors" onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-brand-red)'} onMouseLeave={(e) => e.currentTarget.style.color = ''}>{caso.id}</span>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm ${STATE_COLORS[caso.status]}`}>
                            {caso.status}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-800 truncate mb-1">{caso.subject}</p>
                        <p className="text-xs text-slate-500">Asignado a: <span className="font-bold text-slate-700">{caso.agenteAsignado.nombre}</span></p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-6 ml-4">
                      <div className="hidden sm:block bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                        <p className="text-[10px] font-black text-red-600 uppercase mb-0.5">Atraso</p>
                        <p className="text-base font-black text-red-700">{caso.diasAbierto} días</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-16 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="text-slate-600 font-semibold mb-1">No hay casos críticos</p>
                  <p className="text-slate-400 text-sm">¡Buen trabajo! Todo está bajo control.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Agent Status */}
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border-2" style={{background: 'linear-gradient(to right, rgba(16, 122, 180, 0.1), rgba(64, 154, 187, 0.1))', borderColor: 'rgba(16, 122, 180, 0.2)'}}>
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-accent-blue rounded-xl shadow-brand-blue-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              Rendimiento de Agentes
            </h3>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/50 shadow-sm p-5 space-y-3">
            {[
              { name: 'Juan Agente', active: 5, status: 'Online', color: 'bg-green-500', ring: 'ring-green-500/20' },
              { name: 'Ana Agente', active: 3, status: 'Online', color: 'bg-green-500', ring: 'ring-green-500/20' },
              { name: 'Luis Agente', active: 0, status: 'Vacaciones', color: 'bg-amber-400', ring: 'ring-amber-400/20' },
            ].map((agente, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all duration-200 border border-transparent hover:border-slate-200 group"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={`relative w-3 h-3 rounded-full ${agente.color} ${agente.ring} ring-2`}>
                    <div className={`absolute inset-0 ${agente.color} rounded-full animate-ping opacity-75`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{agente.name}</p>
                    <p className="text-[10px] text-slate-500 font-black uppercase">{agente.status}</p>
                  </div>
                </div>
                <div className="text-right bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 group-hover:bg-blue-50 group-hover:border-blue-200 transition-all">
                  <p className="text-base font-black text-slate-900 group-hover:text-blue-600">{agente.active}</p>
                  <p className="text-[10px] text-slate-500 font-black uppercase">Casos</p>
                </div>
              </div>
            ))}
            <button 
              onClick={() => navigate('/app/agentes')}
              className="w-full mt-3 py-3 text-sm font-bold border-2 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
              style={{color: 'var(--color-accent-blue)', borderColor: 'rgba(16, 122, 180, 0.2)'}}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.background = 'linear-gradient(to right, var(--color-accent-blue), var(--color-accent-blue-2))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-accent-blue)';
                e.currentTarget.style.background = '';
              }}
            >
              Gestionar Equipo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisorPanel;
