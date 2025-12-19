
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Agente } from '../types';
import { Users, UserCheck, UserX, Sun, Briefcase, RefreshCw } from 'lucide-react';

const GestionAgentes: React.FC = () => {
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAgentes();
  }, []);

  const loadAgentes = async () => {
    setLoading(true);
    const data = await api.getAgentes();
    setAgentes([...data]);
    setLoading(false);
  };

  const toggleEstado = async (id: string, actual: string) => {
    const nuevo = actual === 'Activo' ? 'Inactivo' : 'Activo';
    await api.updateAgente(id, { estado: nuevo as any });
    loadAgentes();
  };

  const setVacaciones = async (id: string) => {
    await api.updateAgente(id, { estado: 'Vacaciones' });
    loadAgentes();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-100">
         <div>
           <h2 className="text-lg font-black text-slate-900 mb-1">Gestión de Agentes</h2>
           <p className="text-slate-600 text-sm font-medium">Control de disponibilidad y carga de trabajo del equipo SAC.</p>
         </div>
         <button 
           onClick={loadAgentes} 
           className="p-3 text-accent-gray hover:bg-white rounded-xl transition-all shadow-sm hover:shadow-md"
           style={{color: 'var(--color-accent-gray)'}}
           onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-accent-blue)'}
           onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-accent-gray)'}
           title="Actualizar lista"
         >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
         </button>
      </div>

      {agentes.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-slate-200/50 p-16 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">No hay agentes disponibles</h3>
          <p className="text-slate-500 text-sm">Los agentes aparecerán aquí cuando estén registrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agentes.map(agente => {
            const estadoColors = {
              'Activo': { bg: 'var(--color-accent-blue-2)', ring: 'rgba(64, 154, 187, 0.2)', text: 'var(--color-accent-blue)', badge: 'rgba(64, 154, 187, 0.1)' },
              'Vacaciones': { bg: 'bg-amber-400', ring: 'ring-amber-400/20', text: 'text-amber-700', badge: 'bg-amber-50 border-amber-200' },
              'Inactivo': { bg: 'bg-slate-300', ring: 'ring-slate-300/20', text: 'text-slate-600', badge: 'bg-slate-50 border-slate-200' }
            };
            const colors = estadoColors[agente.estado as keyof typeof estadoColors] || estadoColors.Inactivo;
            
            return (
              <div 
                key={agente.idAgente} 
                className="bg-white rounded-2xl border-2 border-slate-200/50 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group hover:-translate-y-1"
              >
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-center font-black text-xl shadow-lg">
                        {agente.nombre.charAt(0)}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ring-2" style={{backgroundColor: colors.bg, '--tw-ring-color': colors.ring} as React.CSSProperties & { '--tw-ring-color': string }}>
                        <div className="absolute inset-0 rounded-full animate-ping opacity-75" style={{backgroundColor: colors.bg}}></div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-slate-900 text-lg mb-1 truncate">{agente.nombre}</h4>
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border" style={{backgroundColor: colors.badge, borderColor: colors.ring}}>
                        <span className="w-2 h-2 rounded-full" style={{backgroundColor: colors.bg}}></span>
                        <span className="text-xs font-black uppercase" style={{color: colors.text}}>{agente.estado}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-5 border-y-2 border-slate-100 mb-5 bg-gradient-to-r from-slate-50/50 to-transparent rounded-lg">
                    <div className="text-center">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Casos Activos</p>
                       <p className="text-2xl font-black text-slate-900">{agente.casosActivos}</p>
                    </div>
                    <div className="text-center border-l-2 border-slate-100">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Orden R-Robin</p>
                       <p className="text-2xl font-black text-slate-900">#{agente.ordenRoundRobin}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => toggleEstado(agente.idAgente, agente.estado)}
                      className={`flex-1 py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md ${
                        agente.estado === 'Activo' 
                          ? 'bg-accent-light text-accent-gray hover:bg-accent-light border border-accent-light' 
                          : 'bg-gradient-brand-blue text-white shadow-brand-blue-lg'
                      }`}
                      style={agente.estado !== 'Activo' ? {background: 'linear-gradient(to right, var(--color-accent-blue), var(--color-accent-blue-2))'} : {}}
                      onMouseEnter={(e) => {
                        if (agente.estado !== 'Activo') {
                          e.currentTarget.style.background = 'linear-gradient(to right, var(--color-brand-blue), var(--color-accent-blue))';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (agente.estado !== 'Activo') {
                          e.currentTarget.style.background = 'linear-gradient(to right, var(--color-accent-blue), var(--color-accent-blue-2))';
                        }
                      }}
                    >
                      {agente.estado === 'Activo' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      {agente.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                    </button>
                    <button 
                      onClick={() => setVacaciones(agente.idAgente)}
                      className="px-4 py-3 bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 rounded-xl hover:from-amber-200 hover:to-amber-100 transition-all border border-amber-200 shadow-sm hover:shadow-md"
                      title="Marcar Vacaciones"
                    >
                      <Sun className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GestionAgentes;
