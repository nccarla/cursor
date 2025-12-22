
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Caso, CaseStatus } from '../types';
import { STATE_COLORS } from '../constants';
import { AlertCircle, Clock, Users, ArrowUpRight, ChevronRight, Activity } from 'lucide-react';
import AnimatedNumber from '../components/AnimatedNumber';
import Carousel from '../components/Carousel';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from 'recharts';

const SupervisorPanel: React.FC = () => {
  const [casos, setCasos] = useState<Caso[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.getCases().then(setCasos);
  }, []);

  const casosAbiertos = casos.filter(c => c.status !== CaseStatus.CERRADO && c.status !== CaseStatus.RESUELTO);
  const casosCriticos = casosAbiertos.filter(c => c.diasAbierto >= c.categoria.slaDias || c.status === CaseStatus.ESCALADO);
  
  // Calcular casos por agente desde los datos reales
  const casosPorAgente = casos.reduce((acc, caso) => {
    const nombreAgente = caso.agentName || caso.agenteAsignado?.nombre || 'Sin asignar';
    acc[nombreAgente] = (acc[nombreAgente] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Configuración de colores por agente (usando paleta oficial de Intelfon)
  const coloresAgentes: Record<string, { color: string; status: string }> = {
    'Juan Agente': { color: '#c8151b', status: 'Online' }, // brand-red (primario)
    'Ana Agente': { color: '#107ab4', status: 'Online' }, // accent-blue (azul brillante)
    'Luis Agente': { color: '#145478', status: 'Vacaciones' }, // brand-blue (azul oscuro primario)
    'Sin asignar': { color: '#afacb2', status: 'Sin asignar' }, // brand-gray (gris primario)
  };
  
  // Crear array de datos de agentes con casos reales
  const agentesData = Object.entries(casosPorAgente).map(([nombre, cantidad]) => ({
    name: nombre,
    active: cantidad,
    status: coloresAgentes[nombre]?.status || 'Online',
    color: coloresAgentes[nombre]?.color || '#409abb' // accent-blue-2 (azul medio)
  }));
  
  const totalCasos = casos.length;
  
  // Calcular porcentajes (el gráfico mostrará porcentajes, no valores absolutos)
  const pieChartData = agentesData.map((agente, index) => {
    const porcentaje = totalCasos > 0 ? (agente.active / totalCasos) * 100 : 0;
    return {
      name: agente.name,
      value: porcentaje, // Usar porcentaje como valor para que sume 100%
      casos: agente.active, // Guardar cantidad real de casos para mostrar en tooltip
      status: agente.status,
      fill: agente.color,
      percent: porcentaje,
      exploded: index >= Math.max(0, agentesData.length - 3), // Los últimos 3 segmentos estarán "exploded"
      index: index
    };
  });
  
  const stats = [
    { label: 'Casos Abiertos', value: casosAbiertos.length, icon: Activity, color: 'var(--color-accent-blue)', bg: 'rgba(16, 122, 180, 0.1)' },
    { label: 'Casos Críticos', value: casosCriticos.length, icon: AlertCircle, color: 'var(--color-brand-red)', bg: 'rgba(200, 21, 27, 0.1)' },
    { label: 'SLA Promedio', value: '92%', icon: Clock, color: 'var(--color-accent-blue-2)', bg: 'rgba(64, 154, 187, 0.1)' },
    { label: 'Agentes Online', value: '4/5', icon: Users, color: 'var(--color-accent-blue-3)', bg: 'rgba(123, 185, 203, 0.1)' },
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Row con Carrusel en móviles */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const gradients = [
            'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            'linear-gradient(135deg, rgba(200, 21, 27, 0.1) 0%, rgba(245, 41, 56, 0.1) 100%)',
            'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
          ];
          const textColors = ['text-slate-900', 'text-red-700', 'text-slate-900', 'text-slate-900'];
          const labelColors = ['text-slate-600', 'text-red-600', 'text-slate-600', 'text-slate-600'];
          return (
            <div 
              key={idx} 
              className="p-6 rounded-2xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-between group hover:-translate-y-2 animate-in fade-in slide-in-from-bottom bg-white"
              style={{ 
                background: gradients[idx],
                borderColor: idx === 1 ? 'rgba(200, 21, 27, 0.2)' : 'rgba(226, 232, 240, 0.5)',
                animationDelay: `${idx * 100}ms` 
              }}
            >
              <div className="flex-1">
                <p className={`text-xs font-medium ${labelColors[idx]} tracking-normal mb-2`} style={{letterSpacing: '0'}}>{stat.label}</p>
                <h3 className={`text-3xl font-semibold ${textColors[idx]} group-hover:scale-110 transition-transform duration-300`} style={{letterSpacing: '-0.02em', lineHeight: '1.3'}}>
                  {typeof stat.value === 'number' ? <AnimatedNumber value={stat.value} /> : stat.value}
                </h3>
              </div>
              <div className="p-4 rounded-xl group-hover:scale-125 group-hover:rotate-6 transition-all duration-300 shadow-lg animate-float" style={{backgroundColor: idx === 1 ? 'rgba(200, 21, 27, 0.15)' : 'rgba(26, 26, 26, 0.08)', animationDelay: `${idx * 200}ms`}}>
                <stat.icon className="w-6 h-6" style={{color: stat.color}} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Carrusel para móviles */}
      <div className="md:hidden">
        <Carousel autoPlay={true} interval={4000} showDots={true} showArrows={true}>
          {stats.map((stat, idx) => {
            const gradients = [
              'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              'linear-gradient(135deg, rgba(200, 21, 27, 0.1) 0%, rgba(245, 41, 56, 0.1) 100%)',
              'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
            ];
            const textColors = ['text-slate-900', 'text-red-700', 'text-slate-900', 'text-slate-900'];
            const labelColors = ['text-slate-600', 'text-red-600', 'text-slate-600', 'text-slate-600'];
            return (
              <div 
                key={idx} 
                className="p-6 rounded-2xl border-2 shadow-lg flex items-center justify-between mx-2 bg-white"
                style={{
                  background: gradients[idx],
                  borderColor: idx === 1 ? 'rgba(200, 21, 27, 0.2)' : 'rgba(226, 232, 240, 0.5)'
                }}
              >
                <div className="flex-1">
                  <p className={`text-xs font-medium ${labelColors[idx]} tracking-normal mb-2`}>{stat.label}</p>
                  <h3 className={`text-3xl font-semibold ${textColors[idx]}`}>
                    {typeof stat.value === 'number' ? <AnimatedNumber value={stat.value} /> : stat.value}
                  </h3>
                </div>
                <div className="p-4 rounded-xl shadow-lg" style={{backgroundColor: idx === 1 ? 'rgba(200, 21, 27, 0.15)' : 'rgba(26, 26, 26, 0.08)'}}>
                  <stat.icon className="w-6 h-6" style={{color: stat.color}} />
                </div>
              </div>
            );
          })}
        </Carousel>
      </div>

      {/* Grid con Casos Críticos a la izquierda y Rendimiento a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Critical Cases List - Ocupa 2 columnas */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border-2 shadow-lg" style={{borderColor: 'rgba(200, 21, 27, 0.2)'}}>
            <div className="flex justify-between items-center p-4 border-b-2" style={{background: 'linear-gradient(to right, rgba(200, 21, 27, 0.1), rgba(245, 41, 56, 0.1))', borderColor: 'rgba(200, 21, 27, 0.2)'}}>
              <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-3" style={{letterSpacing: '-0.01em', lineHeight: '1.4'}}>
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

            {casosCriticos.length > 0 ? (
              <div className="p-4 grid grid-cols-1 gap-3">
              {casosCriticos.map((caso, idx) => (
                <div 
                  key={caso.id} 
                  onClick={() => navigate(`/app/casos/${caso.id}`)}
                  className="bg-slate-50 rounded-xl border border-slate-200 hover:border-red-300 hover:shadow-md transition-all duration-300 cursor-pointer p-4 group animate-in slide-in-from-left fade-in relative"
                  style={{ 
                    animationDelay: `${idx * 50}ms`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fef2f2';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(200, 21, 27, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-1.5 h-12 bg-gradient-to-b from-red-500 to-red-600 rounded-full shadow-sm flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-slate-900 transition-colors" style={{letterSpacing: '0'}} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-brand-red)'} onMouseLeave={(e) => e.currentTarget.style.color = ''}>{caso.id}</span>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm ${STATE_COLORS[caso.status]}`}>
                            {caso.status}
                          </span>
                        </div>
                      <p className="text-sm font-semibold text-slate-800 truncate mb-1" style={{letterSpacing: '0', lineHeight: '1.5'}}>{caso.subject}</p>
                      <p className="text-xs text-slate-600" style={{letterSpacing: '0', lineHeight: '1.5'}}>Asignado a: <span className="font-semibold text-slate-700">{caso.agenteAsignado.nombre}</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 flex-shrink-0">
                      <div className="hidden sm:block bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                        <p className="text-xs font-medium text-red-600 mb-0.5">Atraso</p>
                        <p className="text-base font-semibold text-red-700">{caso.diasAbierto} días</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </div>
              ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-slate-600 font-semibold mb-1">No hay casos críticos</p>
                <p className="text-slate-400 text-sm">¡Buen trabajo! Todo está bajo control.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Agent Status - Ocupa 1 columna */}
        <div>
          <div 
            className="rounded-2xl border-2 shadow-lg bg-white"
            style={{
              borderColor: 'rgba(16, 122, 180, 0.2)'
            }}
          >
            <div className="p-4 border-b-2" style={{background: 'linear-gradient(to right, rgba(20, 84, 120, 0.1), rgba(16, 122, 180, 0.1))', borderColor: 'rgba(16, 122, 180, 0.2)'}}>
              <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-3" style={{letterSpacing: '-0.01em', lineHeight: '1.4'}}>
                <div className="p-2 rounded-xl shadow-brand-blue-lg" style={{backgroundColor: 'var(--color-accent-blue)'}}>
                  <Users className="w-5 h-5 text-white" />
                </div>
                Rendimiento de Agentes
              </h3>
            </div>
            <div className="p-5">
              {/* Gráfico arriba */}
              <div className="flex justify-center mb-4">
                <ResponsiveContainer width={280} height={280}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props: any) => {
                        const percentage = props.payload?.percent ?? props.value;
                        return `${percentage.toFixed(1)}%`;
                      }}
                      outerRadius={100}
                      innerRadius={50}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={2}
                      isAnimationActive={true}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid rgba(226, 232, 240, 0.5)',
                        borderRadius: '8px',
                        padding: '8px',
                        fontWeight: 'bold',
                        fontSize: '14px'
                      }}
                      labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                      formatter={(value: number, name: string, props: any) => [
                        `${props.payload.casos} casos (${value.toFixed(1)}%)`,
                        props.payload.name
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Leyenda abajo */}
              <div className="space-y-2">
                {pieChartData.length > 0 ? (
                  pieChartData.map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: entry.fill }}
                        />
                        <span className="font-semibold text-slate-800">{entry.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">{entry.status}</span>
                        <span className="font-bold text-slate-900">{entry.casos} casos ({entry.percent.toFixed(1)}%)</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 text-center">No hay casos asignados</p>
                )}
              </div>
              <button 
                onClick={() => navigate('/app/agentes')}
                className="w-full mt-4 py-3 text-sm font-bold border-2 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
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
    </div>
  );
};

export default SupervisorPanel;
