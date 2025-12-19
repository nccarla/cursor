
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Case, CaseStatus, KPI } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Users, Clock, ThumbsUp, BarChart3 } from 'lucide-react';
import AnimatedNumber from '../components/AnimatedNumber';

const GerenteDashboard: React.FC = () => {
  const [casos, setCasos] = useState<Case[]>([]);
  const [kpis, setKpis] = useState<KPI>({ totalCases: 0, slaCompliance: 0, csatScore: 0 });

  useEffect(() => {
    api.getCases().then(setCasos);
    api.getKPIs().then(setKpis);
  }, []);

  const abiertos = casos.filter(c => c.status !== CaseStatus.CERRADO && c.status !== CaseStatus.RESUELTO).length;
  const vencidos = casos.filter(c => c.slaExpired).length;

  const chartData = [
    { name: 'Nuevos', value: casos.filter(c => c.status === CaseStatus.NUEVO).length },
    { name: 'En Proceso', value: casos.filter(c => c.status === CaseStatus.EN_PROCESO).length },
    { name: 'Escalados', value: casos.filter(c => c.status === CaseStatus.ESCALADO).length },
    { name: 'Resueltos', value: casos.filter(c => c.status === CaseStatus.RESUELTO).length },
  ];

  const COLORS = ['var(--color-accent-blue)', 'var(--color-accent-blue-2)', 'var(--color-brand-red)', 'var(--color-accent-blue-3)'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Casos Abiertos', value: abiertos, color: 'text-slate-700', bg: 'bg-slate-50', icon: TrendingUp, border: 'border-slate-200' },
          { label: 'Excedidos SLA', value: vencidos, color: 'text-red-600', bg: 'bg-red-50', icon: Clock, border: 'border-red-200' },
          { label: 'CSAT Promedio', value: kpis.csatScore, color: 'text-green-600', bg: 'bg-green-50', icon: ThumbsUp, border: 'border-green-200' },
          { label: 'Total Histórico', value: kpis.totalCases, color: 'text-slate-600', bg: 'bg-slate-50', icon: Users, border: 'border-slate-200' },
        ].map((kpi, idx) => (
          <div 
            key={idx} 
            className={`bg-white p-6 rounded-2xl border-2 border-slate-200/50 shadow-sm hover:shadow-lg transition-all duration-300 flex items-center justify-between group hover:-translate-y-2 animate-in fade-in scale-in animate-stagger-${idx + 1}`}
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-500 tracking-normal mb-2">{kpi.label}</p>
              <h3 className={`text-4xl font-semibold ${kpi.color} group-hover:scale-110 transition-transform duration-300`}>
                <AnimatedNumber value={kpi.value} />
              </h3>
            </div>
            <div className={`p-4 rounded-xl ${kpi.bg} border-2 ${kpi.border} group-hover:scale-125 group-hover:rotate-6 transition-all duration-300 shadow-sm animate-float`} style={{ animationDelay: `${idx * 200}ms` }}>
              <kpi.icon className={`w-7 h-7 ${kpi.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-200/50 shadow-sm hover:shadow-lg transition-all duration-300 animate-in slide-in-from-left fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg animate-pulse-glow" style={{backgroundColor: 'rgba(45, 45, 45, 0.1)'}}>
              <BarChart3 className="w-5 h-5" style={{color: 'var(--color-accent-blue)'}} />
            </div>
            <h3 className="text-xl font-semibold text-slate-900">Distribución por Estado</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border-2 border-slate-200/50 shadow-sm hover:shadow-lg transition-all duration-300 animate-in slide-in-from-right fade-in">
           <div className="flex items-center gap-3 mb-6">
             <div className="p-2 rounded-lg animate-pulse-glow" style={{backgroundColor: 'rgba(74, 74, 74, 0.1)'}}>
               <Clock className="w-5 h-5" style={{color: 'var(--color-accent-blue-2)'}} />
             </div>
             <h3 className="text-xl font-semibold text-slate-900">Cumplimiento de SLA</h3>
           </div>
           <div className="h-72 flex flex-col justify-center items-center">
              <div className="relative animate-in scale-in" style={{ animationDelay: '200ms' }}>
                <div className="w-56 h-56 rounded-full border-[16px] flex flex-col items-center justify-center shadow-lg animate-float" style={{borderColor: 'var(--color-accent-blue-2)', boxShadow: '0 10px 15px -3px rgba(74, 74, 74, 0.2)'}}>
                   <span className="text-5xl font-semibold text-slate-900">
                     <AnimatedNumber value={kpis.slaCompliance} />%
                   </span>
                   <span className="text-xs font-medium text-slate-500 tracking-normal mt-1">On Target</span>
                </div>
                <div className="absolute inset-0 rounded-full border-[16px] animate-pulse" style={{borderColor: 'rgba(74, 74, 74, 0.3)'}}></div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default GerenteDashboard;
