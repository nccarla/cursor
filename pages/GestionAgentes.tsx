
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
      <div className="flex justify-between items-center">
         <p className="text-slate-500 text-sm font-medium">Control de disponibilidad y carga de trabajo del equipo SAC.</p>
         <button onClick={loadAgentes} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agentes.map(agente => (
          <div key={agente.idAgente} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xl">
                  {agente.nombre.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{agente.nombre}</h4>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${agente.estado === 'Activo' ? 'bg-green-500' : agente.estado === 'Vacaciones' ? 'bg-amber-500' : 'bg-slate-300'}`}></span>
                    <span className="text-xs font-bold text-slate-500 uppercase">{agente.estado}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50 mb-4">
                <div className="text-center">
                   <p className="text-[10px] font-bold text-slate-400 uppercase">Casos Activos</p>
                   <p className="text-xl font-black text-slate-800">{agente.casosActivos}</p>
                </div>
                <div className="text-center border-l border-slate-50">
                   <p className="text-[10px] font-bold text-slate-400 uppercase">Orden R-Robin</p>
                   <p className="text-xl font-black text-slate-800">#{agente.ordenRoundRobin}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => toggleEstado(agente.idAgente, agente.estado)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${agente.estado === 'Activo' ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-green-600 text-white hover:bg-green-700'}`}
                >
                  {agente.estado === 'Activo' ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                  {agente.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                </button>
                <button 
                  onClick={() => setVacaciones(agente.idAgente)}
                  className="px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
                  title="Marcar Vacaciones"
                >
                  <Sun className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GestionAgentes;
