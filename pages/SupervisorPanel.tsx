
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
    { label: 'Casos Abiertos', value: casosAbiertos.length, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Casos Críticos', value: casosCriticos.length, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'SLA Promedio', value: '92%', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Agentes Online', value: '4/5', icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${stat.bg}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Critical Cases List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" /> Casos Críticos / Escalamientos
            </h3>
            <button 
              onClick={() => navigate('/app/casos')}
              className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Ver todos <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {casosCriticos.length > 0 ? (
                casosCriticos.map(caso => (
                  <div 
                    key={caso.id} 
                    onClick={() => navigate(`/app/casos/${caso.id}`)}
                    className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-10 bg-red-500 rounded-full"></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-900">{caso.id}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATE_COLORS[caso.status]}`}>
                            {caso.status}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-700 truncate max-w-[300px]">{caso.subject}</p>
                        <p className="text-xs text-slate-400">Asignado a: <span className="font-bold">{caso.agenteAsignado.nombre}</span></p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-6">
                      <div className="hidden sm:block">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Atraso</p>
                        <p className="text-sm font-black text-red-600">{caso.diasAbierto} días</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center">
                  <p className="text-slate-400 font-medium italic">No hay casos críticos actualmente. ¡Buen trabajo!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Agent Status */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" /> Rendimiento de Agentes
          </h3>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4">
            {[
              { name: 'Juan Agente', active: 5, status: 'Online', color: 'bg-green-500' },
              { name: 'Ana Agente', active: 3, status: 'Online', color: 'bg-green-500' },
              { name: 'Luis Agente', active: 0, status: 'Vacaciones', color: 'bg-amber-400' },
            ].map((agente, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${agente.color}`}></div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{agente.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{agente.status}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-700">{agente.active}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Casos</p>
                </div>
              </div>
            ))}
            <button 
              onClick={() => navigate('/app/agentes')}
              className="w-full mt-2 py-2 text-xs font-bold text-slate-500 hover:text-blue-600 border border-slate-100 rounded-lg hover:bg-blue-50 transition-all"
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
