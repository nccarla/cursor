
import React, { useEffect } from 'react';
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

  // Validar que el usuario tenga token válido (debe estar registrado en n8n o ser cuenta demo)
  useEffect(() => {
    const token = api.getToken();
    
    // Si no hay token, el usuario no está autenticado correctamente
    if (!token) {
      console.warn('Token no encontrado. Redirigiendo al login.');
      api.logout();
      navigate('/login');
      return;
    }
    
    // Validar estructura del usuario
    if (!user || !user.id || !user.name || !user.role) {
      console.warn('Usuario con estructura inválida. Redirigiendo al login.');
      api.logout();
      navigate('/login');
      return;
    }
    
    // Validar rol (permite cuentas demo y cuentas de n8n)
    if (!['AGENTE', 'SUPERVISOR', 'GERENTE'].includes(user.role)) {
      console.warn('Usuario con rol inválido. Redirigiendo al login.');
      api.logout();
      navigate('/login');
      return;
    }
  }, [user, navigate]);

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
    <div className="flex min-h-screen" style={{background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'}}>
      <aside className="w-72 text-white flex flex-col fixed h-full z-10 shadow-2xl" style={{background: 'linear-gradient(180deg, var(--color-brand-blue) 0%, var(--color-accent-blue) 100%)', borderRight: '1px solid rgba(255,255,255,0.1)'}}>
        <div className="p-6 border-b" style={{borderColor: 'rgba(255,255,255,0.15)'}}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/20">
              <ShieldAlert className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">INTELFON SAC</h1>
              <p className="text-xs text-white/80 tracking-normal font-medium">Gestión de Casos</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 mt-6 px-4 space-y-2 overflow-y-auto">
          {navItems.filter(item => item.roles.includes(user?.role as Role)).map((item, idx) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`group flex items-center w-full px-4 py-3.5 text-sm font-semibold rounded-2xl transition-all duration-300 relative animate-in slide-in-from-left fade-in ${
                  isActive 
                    ? 'bg-white text-slate-900 shadow-xl' 
                    : 'text-white/80 hover:bg-white/15 hover:text-white'
                }`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-white rounded-r-full shadow-lg"></div>
                )}
                <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-slate-100' : 'bg-white/10 group-hover:bg-white/20'}`}>
                  <item.icon className={`w-5 h-5 transition-transform ${isActive ? 'text-slate-700 scale-110' : 'text-white group-hover:scale-110'}`} />
                </div>
                <span className="flex-1 text-left ml-3">{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-5 border-t bg-white/5 backdrop-blur-sm" style={{borderColor: 'rgba(255,255,255,0.15)'}}>
          <div className="flex items-center mb-4 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 transition-all duration-300 cursor-pointer group">
            <div className="relative">
              <img 
                src={user?.avatar} 
                alt={user?.name} 
                className="w-12 h-12 rounded-2xl ring-2 ring-white/30 shadow-lg group-hover:ring-white/50 transition-all"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-lg" style={{borderColor: 'var(--color-brand-blue)'}}></div>
            </div>
            <div className="ml-3 overflow-hidden flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-white">{user?.name}</p>
              <p className="text-xs text-white/70 truncate font-medium tracking-normal">
                {user?.role}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-semibold text-white/80 rounded-2xl hover:bg-white/20 hover:text-white transition-all duration-300 group border border-white/10"
          >
            <LogOut className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-72 min-h-screen">
        <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b shadow-sm" style={{borderColor: 'rgba(226, 232, 240, 0.5)'}}>
          <div className="px-8 py-5">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight" style={{letterSpacing: '-0.02em'}}>
              {getPageTitle()}
            </h2>
            <p className="text-slate-500 text-sm mt-1.5 font-medium tracking-normal">INTELFON SAC &bull; Centro de Soporte</p>
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
