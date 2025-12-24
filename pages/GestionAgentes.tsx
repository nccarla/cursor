
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Agente } from '../types';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Sun, 
  RefreshCw, 
  UserPlus, 
  Trash2, 
  X, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  RotateCcw
} from 'lucide-react';

const GestionAgentes: React.FC = () => {
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [agenteToDelete, setAgenteToDelete] = useState<Agente | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Responsive: 1 en mobile, 3-4 en desktop
  const [itemsPerView, setItemsPerView] = useState(3);
  const totalPages = Math.ceil(agentes.length / itemsPerView);

  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth < 640) {
        setItemsPerView(1); // Mobile: 1 card
      } else if (window.innerWidth < 1024) {
        setItemsPerView(2); // Tablet: 2 cards
      } else {
        setItemsPerView(3); // Desktop: 3 cards
      }
    };
    
    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);

  useEffect(() => {
    loadAgentes();
    
    const handleAgenteCreado = () => {
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

  const scrollToIndex = (index: number) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const firstCard = container.querySelector('.snap-center') as HTMLElement;
    if (!firstCard) return;
    
    const cardWidth = firstCard.offsetWidth + 16; // width + gap
    const scrollPosition = index * cardWidth * itemsPerView;
    
    container.scrollTo({
      left: scrollPosition,
      behavior: 'smooth'
    });
    setCurrentIndex(index);
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const cardWidth = container.offsetWidth / itemsPerView;
    const scrollPosition = container.scrollLeft;
    const newIndex = Math.round(scrollPosition / (cardWidth * itemsPerView));
    setCurrentIndex(newIndex);
  };

  const nextPage = () => {
    if (currentIndex < totalPages - 1) {
      scrollToIndex(currentIndex + 1);
    }
  };

  const prevPage = () => {
    if (currentIndex > 0) {
      scrollToIndex(currentIndex - 1);
    }
  };

  const getEstadoRingColor = (estado: string) => {
    switch (estado) {
      case 'Activo':
        return 'ring-green-500';
      case 'Vacaciones':
        return 'ring-amber-500';
      case 'Inactivo':
        return 'ring-red-500';
      default:
        return 'ring-slate-400';
    }
  };

  const getEstadoBadge = (estado: string) => {
    const styles = {
      'Activo': 'bg-green-50 text-green-700 border-green-200',
      'Vacaciones': 'bg-amber-50 text-amber-700 border-amber-200',
      'Inactivo': 'bg-red-50 text-red-700 border-red-200'
    };
    return styles[estado as keyof typeof styles] || styles.Inactivo;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gradient-to-r from-slate-50 to-slate-100 p-5 rounded-2xl border border-slate-200">
         <div>
           <h2 className="text-lg font-semibold text-slate-900 mb-1">Gestión de Agentes</h2>
           <p className="text-slate-600 text-sm font-medium">Control de disponibilidad y carga de trabajo del equipo SAC.</p>
         </div>
         <div className="flex gap-3">
           <button 
             onClick={() => navigate('/app/crear-cuenta')}
             className="px-4 py-2 text-white font-semibold rounded-xl hover:shadow-xl transition-all flex items-center gap-2 hover:-translate-y-0.5"
             style={{background: 'linear-gradient(to right, var(--color-brand-red), var(--color-accent-red))', boxShadow: '0 12px 30px rgba(200, 21, 27, 0.25)'}}
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
        <div className="relative w-full">
          {/* Carrusel Container */}
          <div className="relative w-full">
            {/* Flechas de Navegación */}
            {agentes.length > itemsPerView && (
              <>
                <button
                  onClick={prevPage}
                  disabled={currentIndex === 0}
                  className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white rounded-full p-2.5 shadow-lg hover:shadow-xl transition-all duration-200 ${
                    currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
                  }`}
                  aria-label="Anterior"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-700" />
                </button>
                <button
                  onClick={nextPage}
                  disabled={currentIndex >= totalPages - 1}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white rounded-full p-2.5 shadow-lg hover:shadow-xl transition-all duration-200 ${
                    currentIndex >= totalPages - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
                  }`}
                  aria-label="Siguiente"
                >
                  <ChevronRight className="w-5 h-5 text-slate-700" />
                </button>
              </>
            )}

            {/* Scroll Container */}
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth w-full"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitScrollbar: { display: 'none' }
              } as React.CSSProperties}
            >
              <div className="flex gap-4 pb-4">
                {agentes.map((agente, idx) => (
                  <div
                    key={agente.idAgente}
                    className="snap-center flex-shrink-0 bg-white rounded-2xl border-2 border-slate-200/50 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group"
                    style={{
                      width: `calc((100% - ${(itemsPerView - 1) * 16}px) / ${itemsPerView})`,
                      minWidth: '280px'
                    }}
                  >
                    <div className="p-4 w-full">
                      {/* Header: Avatar con Ring de Estado */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-md">
                            {agente.nombre.charAt(0)}
                          </div>
                          <div className={`absolute -inset-1 rounded-xl ring-2 ${getEstadoRingColor(agente.estado)} ring-offset-2 ring-offset-white`}></div>
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <h4 className="font-bold text-slate-900 text-base mb-1 truncate">{agente.nombre}</h4>
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-semibold ${getEstadoBadge(agente.estado)}`}>
                            {agente.estado}
                          </span>
                        </div>
                      </div>

                      {/* Métricas en una fila */}
                      {(() => {
                        // Calcular el orden de prioridad para recibir casos
                        // 1. Filtrar agentes activos
                        // 2. Ordenar por casos activos (menos casos = mayor prioridad)
                        // 3. Si hay empate, usar ordenRoundRobin como desempate
                        const agentesConPrioridad = agentes
                          .map(a => ({
                            ...a,
                            prioridad: a.estado === 'Activo' 
                              ? a.casosActivos * 1000 + a.ordenRoundRobin // Menos casos = menor número = mayor prioridad
                              : 999999 // Agentes inactivos al final
                          }))
                          .sort((a, b) => a.prioridad - b.prioridad);
                        
                        const posicionPrioridad = agentesConPrioridad.findIndex(a => a.idAgente === agente.idAgente) + 1;
                        const esSiguiente = posicionPrioridad === 1 && agente.estado === 'Activo';
                        
                        return (
                          <div className="flex items-center gap-3 py-2.5 mb-3 border-y border-slate-100">
                            <div className="flex items-center gap-2 flex-1 min-w-0" title="Casos activos asignados">
                              <Briefcase className="w-4 h-4 text-slate-500 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-slate-500 truncate">Activos</p>
                                <p className="text-lg font-bold text-slate-900">{agente.casosActivos}</p>
                              </div>
                            </div>
                            <div className="w-px h-8 bg-slate-200 flex-shrink-0"></div>
                            <div className="flex items-center gap-2 flex-1 min-w-0" title={esSiguiente ? 'Siguiente en asignación (menos casos activos entre agentes activos)' : `Orden de prioridad para recibir casos: Posición ${posicionPrioridad}`}>
                              <RotateCcw className="w-4 h-4 text-slate-500 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-slate-500 truncate">R-Robin</p>
                                <p className="text-lg font-bold text-slate-900 whitespace-nowrap">
                                  #{posicionPrioridad}
                                  {esSiguiente && (
                                    <span className="ml-1 text-xs font-semibold text-green-600">Siguiente</span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Acciones */}
                      <div className="space-y-2">
                        {/* Acción Primaria: Activar/Desactivar */}
                        <button 
                          onClick={() => toggleEstado(agente.idAgente, agente.estado)}
                          className={`w-full py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md ${
                            agente.estado === 'Activo' 
                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200' 
                              : 'text-white'
                          }`}
                          style={agente.estado !== 'Activo' ? {
                            background: 'linear-gradient(to right, var(--color-brand-red), var(--color-accent-red))',
                            boxShadow: '0 8px 20px rgba(200, 21, 27, 0.2)'
                          } : {}}
                          onMouseEnter={(e) => {
                            if (agente.estado !== 'Activo') {
                              e.currentTarget.style.background = 'linear-gradient(to right, var(--color-accent-red), var(--color-brand-red))';
                              e.currentTarget.style.boxShadow = '0 10px 24px rgba(245, 41, 56, 0.25)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (agente.estado !== 'Activo') {
                              e.currentTarget.style.background = 'linear-gradient(to right, var(--color-brand-red), var(--color-accent-red))';
                              e.currentTarget.style.boxShadow = '0 8px 20px rgba(200, 21, 27, 0.2)';
                            }
                          }}
                          title={agente.estado === 'Activo' ? 'Desactivar agente' : 'Activar agente'}
                        >
                          {agente.estado === 'Activo' ? <UserX className="w-3.5 h-3.5 flex-shrink-0" /> : <UserCheck className="w-3.5 h-3.5 flex-shrink-0" />}
                          <span className="truncate">{agente.estado === 'Activo' ? 'Desactivar' : 'Activar'}</span>
                        </button>

                        {/* Acciones Secundarias */}
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setVacaciones(agente.idAgente)}
                            disabled={agente.estado === 'Vacaciones'}
                            className={`flex-1 py-2 bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 rounded-xl hover:from-amber-200 hover:to-amber-100 transition-all border border-amber-200 shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 min-w-0 ${
                              agente.estado === 'Vacaciones' ? 'opacity-60 cursor-not-allowed' : ''
                            }`}
                            title={agente.estado === 'Vacaciones' ? 'Ya está en vacaciones' : 'Marcar en vacaciones'}
                          >
                            <Sun className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="text-xs font-semibold truncate">Vacaciones</span>
                          </button>
                          
                          {/* Acción Destructiva Separada */}
                          <button 
                            onClick={() => handleDeleteClick(agente)}
                            className="px-2.5 py-2 bg-gradient-to-r from-red-50 to-red-100 text-red-700 rounded-xl hover:from-red-100 hover:to-red-200 transition-all border border-red-200 shadow-sm hover:shadow-md flex-shrink-0"
                            title="Eliminar agente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Indicadores de Posición */}
          {agentes.length > itemsPerView && totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollToIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'w-8 bg-slate-800 shadow-md'
                      : 'w-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                  aria-label={`Ir a página ${index + 1}`}
                />
              ))}
              <span className="ml-3 text-xs font-medium text-slate-500">
                {currentIndex + 1} / {totalPages}
              </span>
            </div>
          )}
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
