
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Agente } from '../types';
import { Users, UserCheck, UserX, Sun, Briefcase, RefreshCw, UserPlus, Trash2, X, AlertTriangle } from 'lucide-react';

const GestionAgentes: React.FC = () => {
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [agenteToDelete, setAgenteToDelete] = useState<Agente | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadAgentes();
    
    // Escuchar evento cuando se crea un nuevo agente
    const handleAgenteCreado = () => {
      console.log('🔄 Recargando lista de agentes después de crear nuevo agente...');
      loadAgentes();
    };
    
    window.addEventListener('agente-creado', handleAgenteCreado);
    
    return () => {
      window.removeEventListener('agente-creado', handleAgenteCreado);
    };
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

  const handleDeleteClick = (agente: Agente) => {
    setAgenteToDelete(agente);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!agenteToDelete) return;
    
    const success = await api.deleteAgente(agenteToDelete.idAgente);
    if (success) {
      setShowDeleteModal(false);
      setAgenteToDelete(null);
      loadAgentes();
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setAgenteToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gradient-to-r from-slate-50 to-slate-100 p-5 rounded-2xl border border-slate-200 animate-in slide-in-from-top fade-in">
         <div>
           <h2 className="text-lg font-semibold text-slate-900 mb-1">Gestión de Agentes</h2>
           <p className="text-slate-600 text-sm font-medium">Control de disponibilidad y carga de trabajo del equipo SAC.</p>
         </div>
         <div className="flex gap-3">
           <button 
             onClick={() => navigate('/app/crear-cuenta')}
             className="px-4 py-2 bg-gradient-brand-blue text-white font-semibold rounded-xl shadow-brand-blue-lg hover:shadow-xl transition-all flex items-center gap-2 hover:-translate-y-0.5"
             style={{background: 'linear-gradient(to right, var(--color-accent-blue), var(--color-accent-blue-2))'}}
           >
             <UserPlus className="w-4 h-4" />
             Nueva Cuenta
           </button>
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
          {agentes.map((agente, idx) => {
            const estadoColors = {
              'Activo': { bg: 'var(--color-accent-blue-2)', ring: 'rgba(74, 74, 74, 0.2)', text: 'var(--color-accent-blue)', badge: 'rgba(74, 74, 74, 0.1)' },
              'Vacaciones': { bg: 'bg-amber-400', ring: 'ring-amber-400/20', text: 'text-amber-700', badge: 'bg-amber-50 border-amber-200' },
              'Inactivo': { bg: 'bg-slate-300', ring: 'ring-slate-300/20', text: 'text-slate-600', badge: 'bg-slate-50 border-slate-200' }
            };
            const colors = estadoColors[agente.estado as keyof typeof estadoColors] || estadoColors.Inactivo;
            
            return (
              <div 
                key={agente.idAgente} 
                className={`bg-white rounded-2xl border-2 border-slate-200/50 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group hover:-translate-y-2 animate-in fade-in scale-in slide-in-from-bottom`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-center font-semibold text-xl shadow-lg">
                        {agente.nombre.charAt(0)}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ring-2" style={{backgroundColor: colors.bg, '--tw-ring-color': colors.ring} as React.CSSProperties & { '--tw-ring-color': string }}>
                        <div className="absolute inset-0 rounded-full animate-ping opacity-75" style={{backgroundColor: colors.bg}}></div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900 text-lg mb-1 truncate">{agente.nombre}</h4>
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border" style={{backgroundColor: colors.badge, borderColor: colors.ring}}>
                        <span className="w-2 h-2 rounded-full" style={{backgroundColor: colors.bg}}></span>
                        <span className="text-xs font-semibold" style={{color: colors.text}}>{agente.estado}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-5 border-y-2 border-slate-100 mb-5 bg-gradient-to-r from-slate-50/50 to-transparent rounded-lg">
                    <div className="text-center">
                       <p className="text-xs font-medium text-slate-500 tracking-normal mb-1">Casos Activos</p>
                       <p className="text-2xl font-semibold text-slate-900">{agente.casosActivos}</p>
                    </div>
                    <div className="text-center border-l-2 border-slate-100">
                       <p className="text-xs font-medium text-slate-500 tracking-normal mb-1">Orden R-Robin</p>
                       <p className="text-2xl font-semibold text-slate-900">#{agente.ordenRoundRobin}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => toggleEstado(agente.idAgente, agente.estado)}
                      className={`flex-1 py-3 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md ${
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
                    <button 
                      onClick={() => handleDeleteClick(agente)}
                      className="px-4 py-3 bg-gradient-to-r from-red-50 to-red-100 text-red-700 rounded-xl hover:from-red-100 hover:to-red-200 transition-all border border-red-200 shadow-sm hover:shadow-md"
                      title="Eliminar Agente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de confirmación para eliminar agente */}
      {showDeleteModal && agenteToDelete && (
        <div className="fixed inset-0 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in duration-300" style={{backgroundColor: 'rgba(20, 84, 120, 0.7)'}}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform animate-in zoom-in-95 scale-in duration-300 border" style={{borderColor: 'rgba(226, 232, 240, 0.6)', boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.25)'}}>
            <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-red-50 via-white to-red-50" style={{borderColor: 'rgba(200, 21, 27, 0.2)'}}>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl shadow-lg" style={{backgroundColor: 'rgba(200, 21, 27, 0.15)'}}>
                  <AlertTriangle className="w-6 h-6" style={{color: 'var(--color-brand-red)'}} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900" style={{letterSpacing: '-0.02em'}}>Confirmar Eliminación</h3>
                  <p className="text-sm text-slate-500 mt-1 font-medium">Esta acción no se puede deshacer</p>
                </div>
              </div>
              <button 
                onClick={handleDeleteCancel} 
                className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
                <p className="text-sm font-semibold text-red-900 mb-2">
                  ¿Estás seguro de que deseas eliminar al agente?
                </p>
                <div className="bg-white rounded-xl p-3 border border-red-200">
                  <p className="text-base font-bold text-slate-900">{agenteToDelete.nombre}</p>
                  <p className="text-sm text-slate-600">{agenteToDelete.email}</p>
                  <p className="text-xs text-slate-500 mt-1">Estado: <span className="font-semibold">{agenteToDelete.estado}</span></p>
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={handleDeleteCancel} 
                  className="flex-1 py-4 text-sm font-bold text-slate-700 hover:bg-slate-100 rounded-2xl transition-all border border-slate-200 shadow-sm hover:shadow-md"
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  onClick={handleDeleteConfirm} 
                  className="flex-1 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  style={{background: 'linear-gradient(135deg, var(--color-brand-red), var(--color-accent-red))'}}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, var(--color-accent-red), var(--color-brand-red))';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, var(--color-brand-red), var(--color-accent-red))';
                  }}
                >
                  Eliminar Agente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionAgentes;
