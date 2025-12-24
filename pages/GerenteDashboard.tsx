
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Case, CaseStatus, KPI } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Users, Clock, ThumbsUp } from 'lucide-react';

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

  const COLORS = ['#0f172a', '#f59e0b', '#ef4444', '#10b981'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Casos Abiertos', value: abiertos, color: 'text-slate-900', bg: 'bg-slate-900', icon: TrendingUp },
          { label: 'Excedidos SLA', value: vencidos, color: 'text-red-600', bg: 'bg-red-50', icon: Clock },
          { label: 'CSAT Promedio', value: kpis.csatScore, color: 'text-green-600', bg: 'bg-green-50', icon: ThumbsUp },
          { label: 'Total Histórico', value: kpis.totalCases, color: 'text-slate-600', bg: 'bg-slate-50', icon: Users },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{kpi.label}</p>
              <h3 className={`text-3xl font-black mt-1 ${kpi.color}`}>{kpi.value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${kpi.bg}`}>
              <kpi.icon className={`w-6 h-6 ${kpi.bg === 'bg-slate-900' ? 'text-white' : kpi.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Distribución por Estado</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
           <h3 className="text-lg font-bold text-slate-800 mb-6">Cumplimiento de SLA</h3>
           <div className="h-64 flex flex-col justify-center items-center">
              <div className="w-48 h-48 rounded-full border-[12px] border-green-500 flex flex-col items-center justify-center">
                 <span className="text-4xl font-black text-slate-800">{kpis.slaCompliance}%</span>
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">On Target</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default GerenteDashboard;
