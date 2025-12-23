
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
    <div className="flex min-h-screen">
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold tracking-tight text-blue-400">INTELFON SAC</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">Gestión de Casos</p>
        </div>
        
        <nav className="flex-1 mt-6 px-4 space-y-1">
          {navItems.filter(item => item.roles.includes(user?.role as Role)).map((item) => (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                location.pathname === item.path ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center mb-4 px-2">
            <img 
              src={user?.avatar} 
              alt={user?.name} 
              className="w-8 h-8 rounded-full ring-2 ring-slate-800"
            />
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 truncate uppercase font-bold tracking-tighter">
                {user?.role}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-slate-400 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-8">
        <header className="mb-8">
          <h2 className="text-2xl font-black text-slate-800">
            {getPageTitle()}
          </h2>
          <p className="text-slate-500 text-sm">INTELFON SAC &bull; Centro de Soporte</p>
        </header>
        {children}
      </main>
    </div>
  );
};

export default Layout;
