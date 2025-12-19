
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { Role } from '../types';
import { LayoutDashboard, Ticket, Users, BarChart3, LogOut, ShieldAlert } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = api.getUser();

  const handleLogout = () => {
    api.logout();
    navigate('/login');
  };

  const navItems = [
    { 
        name: 'Bandeja de Casos', 
        path: '/app/agente', 
        icon: Ticket,
        roles: ['AGENTE'] as Role[]
    },
    { 
        name: 'Panel Supervisor', 
        path: '/app/supervisor', 
        icon: LayoutDashboard,
        roles: ['SUPERVISOR'] as Role[]
    },
    { 
        name: 'Bandeja Global', 
        path: '/app/casos', 
        icon: Ticket,
        roles: ['SUPERVISOR'] as Role[]
    },
    { 
        name: 'Gestión de Agentes', 
        path: '/app/agentes', 
        icon: Users,
        roles: ['SUPERVISOR'] as Role[]
    },
    { 
        name: 'Panel Ejecutivo', 
        path: '/app/gerencia', 
        icon: BarChart3,
        roles: ['GERENTE'] as Role[]
    },
    { 
        name: 'Alertas Críticas', 
        path: '/app/alertas', 
        icon: ShieldAlert,
        roles: ['SUPERVISOR', 'GERENTE'] as Role[]
    },
  ];

  const getPageTitle = () => {
    const currentItem = navItems.find(item => item.path === location.pathname);
    if (currentItem) return currentItem.name;
    if (location.pathname.includes('/casos/')) return 'Detalle de Caso';
    return 'Sistema SAC';
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 text-white flex flex-col fixed h-full z-10 shadow-2xl border-r" style={{background: 'linear-gradient(180deg, var(--color-brand-blue) 0%, var(--color-accent-darkred) 100%)', borderColor: 'rgba(0,0,0,0.2)'}}>
        <div className="p-6 border-b" style={{borderColor: 'rgba(255,255,255,0.1)'}}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-brand-blue flex items-center justify-center shadow-brand-blue-lg">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white">INTELFON SAC</h1>
              <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold">Gestión de Casos</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 mt-4 px-3 space-y-1 overflow-y-auto">
          {navItems.filter(item => item.roles.includes(user?.role as Role)).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`group flex items-center w-full px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 relative ${
                  isActive 
                    ? 'bg-gradient-brand-blue text-white shadow-brand-blue-lg' 
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                )}
                <item.icon className={`w-5 h-5 mr-3 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="flex-1 text-left">{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t bg-black/20 backdrop-blur-sm" style={{borderColor: 'rgba(255,255,255,0.1)'}}>
          <div className="flex items-center mb-4 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
            <div className="relative">
              <img 
                src={user?.avatar} 
                alt={user?.name} 
                className="w-10 h-10 rounded-xl ring-2 ring-white/20 shadow-lg"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-accent-blue rounded-full border-2" style={{borderColor: 'var(--color-brand-blue)'}}></div>
            </div>
            <div className="ml-3 overflow-hidden flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-white">{user?.name}</p>
              <p className="text-[10px] text-white/60 truncate uppercase font-black tracking-tighter">
                {user?.role}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2.5 text-sm font-semibold text-white/70 rounded-xl hover:bg-accent-red/20 hover:text-accent-red transition-all duration-200 group"
          >
            <LogOut className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64 min-h-screen">
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
          <div className="px-8 py-6">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              {getPageTitle()}
            </h2>
            <p className="text-slate-500 text-sm mt-1 font-medium">INTELFON SAC &bull; Centro de Soporte</p>
          </div>
        </div>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
