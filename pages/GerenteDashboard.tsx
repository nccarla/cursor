
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

  const COLORS = ['var(--color-brand-red)', 'var(--color-accent-red)', 'var(--color-accent-blue)', 'var(--color-accent-blue-2)'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: 'Casos Abiertos', 
            value: abiertos, 
            icon: TrendingUp, 
            gradient: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            iconBg: 'rgba(16, 122, 180, 0.12)',
            iconColor: 'var(--color-accent-blue)',
            textColor: 'text-slate-900',
            labelColor: 'text-slate-600',
            borderColor: 'rgba(16, 122, 180, 0.2)'
          },
          { 
            label: 'Excedidos SLA', 
            value: vencidos, 
            icon: Clock, 
            gradient: 'linear-gradient(135deg, rgba(255, 247, 237, 0.8) 0%, rgba(254, 242, 242, 0.8) 100%)',
            iconBg: 'rgba(200, 21, 27, 0.15)',
            iconColor: 'var(--color-brand-red)',
            textColor: 'text-red-700',
            labelColor: 'text-red-600',
            borderColor: 'rgba(200, 21, 27, 0.25)'
          },
          { 
            label: 'CSAT Promedio', 
            value: kpis.csatScore, 
            icon: ThumbsUp, 
            gradient: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            iconBg: 'rgba(64, 154, 187, 0.12)',
            iconColor: 'var(--color-accent-blue-2)',
            textColor: 'text-slate-900',
            labelColor: 'text-slate-600',
            borderColor: 'rgba(64, 154, 187, 0.2)'
          },
          { 
            label: 'Total Histórico', 
            value: kpis.totalCases, 
            icon: Users, 
            gradient: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            iconBg: 'rgba(16, 122, 180, 0.12)',
            iconColor: 'var(--color-accent-blue)',
            textColor: 'text-slate-900',
            labelColor: 'text-slate-600',
            borderColor: 'rgba(16, 122, 180, 0.2)'
          },
        ].map((kpi, idx) => (
          <div 
            key={idx} 
            className="p-6 rounded-3xl border shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-between group hover:-translate-y-1 animate-in fade-in scale-in bg-white"
            style={{ 
              background: kpi.gradient,
              borderColor: kpi.borderColor,
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              animationDelay: `${idx * 100}ms`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)';
            }}
          >
            <div className="flex-1">
              <p className={`text-xs font-semibold ${kpi.labelColor || 'text-slate-600'} tracking-wide mb-3 uppercase`} style={{letterSpacing: '0.05em'}}>{kpi.label}</p>
              <h3 className={`text-4xl font-bold ${kpi.textColor} group-hover:scale-105 transition-transform duration-300`} style={{letterSpacing: '-0.03em', lineHeight: '1.1'}}>
                <AnimatedNumber value={kpi.value} />
              </h3>
            </div>
            <div 
              className="p-4 rounded-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg" 
              style={{ 
                backgroundColor: kpi.iconBg,
                animationDelay: `${idx * 200}ms`
              }}
            >
              <kpi.icon className="w-7 h-7" style={{ color: kpi.iconColor }} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div 
          className="p-6 rounded-3xl border shadow-xl hover:shadow-2xl transition-all duration-300 animate-in slide-in-from-left fade-in bg-white"
          style={{
            borderColor: 'rgba(16, 122, 180, 0.2)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)';
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl shadow-lg" style={{backgroundColor: 'rgba(16, 122, 180, 0.12)'}}>
              <BarChart3 className="w-6 h-6" style={{color: 'var(--color-accent-blue)'}} />
            </div>
            <h3 className="text-xl font-bold text-slate-900" style={{letterSpacing: '-0.02em'}}>Distribución por Estado</h3>
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
                  cursor={{fill: 'rgba(200, 21, 27, 0.1)'}}
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid rgba(200, 21, 27, 0.2)', 
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    color: '#1e293b'
                  }}
                  labelStyle={{ color: '#1e293b' }}
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

        <div 
          className="p-6 rounded-3xl border shadow-xl hover:shadow-2xl transition-all duration-300 animate-in slide-in-from-right fade-in bg-white"
          style={{
            borderColor: 'rgba(16, 122, 180, 0.2)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)';
          }}
        >
           <div className="flex items-center gap-3 mb-6">
             <div className="p-3 rounded-2xl shadow-lg" style={{backgroundColor: 'rgba(16, 122, 180, 0.12)'}}>
               <Clock className="w-6 h-6" style={{color: 'var(--color-accent-blue)'}} />
             </div>
             <h3 className="text-xl font-bold text-slate-900" style={{letterSpacing: '-0.02em'}}>Cumplimiento de SLA</h3>
           </div>
           <div className="h-72 flex flex-col justify-center items-center">
              <div className="relative animate-in scale-in" style={{ animationDelay: '200ms' }}>
                <div className="w-56 h-56 rounded-full border-[18px] flex flex-col items-center justify-center shadow-2xl" style={{borderColor: 'var(--color-accent-blue)', boxShadow: '0 20px 40px -10px rgba(16, 122, 180, 0.3)'}}>
                   <span className="text-5xl font-bold text-slate-900" style={{letterSpacing: '-0.03em'}}>
                     <AnimatedNumber value={kpis.slaCompliance} />%
                   </span>
                   <span className="text-xs font-semibold text-slate-600 tracking-wide mt-2 uppercase">On Target</span>
                </div>
                <div className="absolute inset-0 rounded-full border-[18px] animate-pulse opacity-30" style={{borderColor: 'rgba(16, 122, 180, 0.3)'}}></div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default GerenteDashboard;
