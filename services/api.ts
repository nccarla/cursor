
import { Case, CaseStatus, KPI, User, Role } from '../types';
import { MOCK_CASOS, MOCK_AGENTES, MOCK_USERS } from './mockData';
import { API_CONFIG } from '../config';

// Inicializar datos en localStorage si no existen
const initStorage = () => {
  if (!localStorage.getItem('intelfon_cases')) {
    localStorage.setItem('intelfon_cases', JSON.stringify(MOCK_CASOS));
  }
  if (!localStorage.getItem('intelfon_agents')) {
    localStorage.setItem('intelfon_agents', JSON.stringify(MOCK_AGENTES));
  }
};

// Función auxiliar para llamar al webhook de n8n
// Solo permite operaciones si el webhook responde correctamente
const callWebhook = async (scenario: 'login' | 'reset_password' | 'new_account', data: any) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    const response = await fetch(API_CONFIG.WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scenario,
        ...data,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Si el servidor responde con error, la cuenta no está registrada o hay un problema
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        message: response.status === 401 || response.status === 403 
          ? 'Credenciales inválidas o cuenta no registrada' 
          : 'Error en la solicitud' 
      }));
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Validaciones estrictas según el escenario
    if (scenario === 'login') {
      // Para login, DEBE haber token y user
      if (!result.token || !result.user) {
        throw new Error('Credenciales inválidas o cuenta no registrada en el sistema');
      }
      // Validar estructura mínima del usuario
      if (!result.user.id || !result.user.name || !result.user.role) {
        throw new Error('La cuenta no está correctamente registrada en el sistema');
      }
    } else if (scenario === 'new_account') {
      // Para nueva cuenta, DEBE haber token y user
      if (!result.token || !result.user) {
        throw new Error('Error al crear la cuenta. La cuenta no pudo ser registrada en el sistema');
      }
      if (!result.user.id || !result.user.name || !result.user.role) {
        throw new Error('La cuenta fue creada pero no tiene información completa');
      }
    } else if (scenario === 'reset_password') {
      // Para reset password, validar según la acción
      if (data.action === 'verify_code' && !result.tempToken) {
        throw new Error('Código de verificación inválido o expirado');
      }
      if (result.success === false) {
        throw new Error(result.message || 'Error en la operación de restablecimiento de contraseña');
      }
    }
    
    return result;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Timeout: El servidor no respondió a tiempo. Verifica tu conexión.');
    }
    if (error.message) {
      throw error;
    }
    throw new Error('Error de conexión con el servidor. La cuenta debe estar registrada en n8n.');
  }
};

// Función auxiliar para autenticación con webhook (escenario: login)
// Solo permite acceso si el webhook de n8n valida la cuenta
const authenticateWithWebhook = async (email: string, password: string): Promise<User> => {
  const data = await callWebhook('login', { email, password });
  
  // El webhook debe retornar: { token: string, user: { id, name, role, avatar? } }
  // Si no hay token o usuario, significa que la cuenta no está registrada o las credenciales son inválidas
  if (!data.token || !data.user) {
    throw new Error('Credenciales inválidas o cuenta no registrada en el sistema');
  }

  // Validar que el usuario tenga un ID válido
  if (!data.user.id) {
    throw new Error('La cuenta no está correctamente registrada en el sistema');
  }

  // Validar que el token sea una cadena no vacía
  if (!data.token || typeof data.token !== 'string' || data.token.trim() === '') {
    throw new Error('Token de autenticación inválido. La cuenta no está correctamente registrada.');
  }

  // Validar que el usuario tenga nombre válido
  if (!data.user.name || typeof data.user.name !== 'string' || data.user.name.trim() === '') {
    throw new Error('Información de usuario incompleta. La cuenta no está correctamente registrada.');
  }

  // Validar que el rol sea válido y venga del webhook
  const userRole = data.user.role;
  if (!userRole || !['AGENTE', 'SUPERVISOR', 'GERENTE'].includes(userRole)) {
    throw new Error('Rol de usuario inválido. La cuenta debe tener un rol válido asignado en n8n.');
  }

  // Almacenar el token JWT para futuras peticiones
  localStorage.setItem('intelfon_token', data.token);
  
  // Almacenar información del usuario EXACTAMENTE como viene del webhook
  // NO se permite sobrescribir con mapeos locales - todo debe venir de n8n
  const user: User = {
    id: data.user.id,
    name: data.user.name.trim(),
    role: userRole,
    avatar: data.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.name)}&background=0f172a&color=fff`
  };

  localStorage.setItem('intelfon_user', JSON.stringify(user));
  return user;
};

// NOTA: No hay mapeos de emails ni modo demo
// Todas las cuentas DEBEN estar registradas en el flujo de n8n
// El webhook de n8n es la única fuente de verdad para autenticación

export const api = {
  getUser(): User | null {
    const data = localStorage.getItem('intelfon_user');
    return data ? JSON.parse(data) : null;
  },

  getToken(): string | null {
    return localStorage.getItem('intelfon_token');
  },

  async authenticate(email: string, pass: string): Promise<User> {
    // Validaciones previas
    if (!email || !email.trim()) {
      throw new Error('El correo electrónico es requerido');
    }
    if (!pass || !pass.trim()) {
      throw new Error('La contraseña es requerida');
    }
    
    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error('Formato de correo electrónico inválido');
    }
    
    // Solo autenticación mediante webhook de n8n - sin modo demo
    // Si el webhook falla o la cuenta no está registrada, se lanza error
    // NO HAY FALLBACK - la cuenta DEBE estar en n8n
    try {
      return await authenticateWithWebhook(email.trim(), pass);
    } catch (error: any) {
      // Limpiar cualquier dato previo en caso de error
      localStorage.removeItem('intelfon_user');
      localStorage.removeItem('intelfon_token');
      throw error;
    }
  },

  async getCases(): Promise<Case[]> {
    initStorage();
    const data = localStorage.getItem('intelfon_cases');
    const cases = data ? JSON.parse(data) : [];
    
    // Si es agente, solo ve sus casos
    const user = this.getUser();
    if (user?.role === 'AGENTE') {
      // Filtrar por ID de agente demo '1' o nombre
      return cases.filter((c: any) => 
        (c.agenteAsignado?.idAgente === '1') || 
        (c.agentId === '1') ||
        (c.agentName === user.name)
      );
    }
    return cases;
  },

  async getCasoById(id: string): Promise<Case | undefined> {
    const cases = await this.getCases();
    return cases.find(c => c.id === id || c.idCaso === id || c.ticketNumber === id);
  },

  async updateCaseStatus(id: string, status: string, detail: string, extra?: any): Promise<boolean> {
    const cases = await this.getCases();
    const idx = cases.findIndex((c: any) => (c.id === id || c.idCaso === id || c.ticketNumber === id));
    
    if (idx !== -1) {
      cases[idx].estado = status;
      cases[idx].status = status;
      if (!cases[idx].historial) cases[idx].historial = [];
      
      cases[idx].historial.unshift({
        fechaHora: new Date().toISOString(),
        detalle: detail || `Cambio de estado a ${status}`,
        usuario: this.getUser()?.name || 'Sistema'
      });

      if (extra?.resolucion) cases[idx].resolucion = extra.resolucion;
      
      localStorage.setItem('intelfon_cases', JSON.stringify(cases));
      return true;
    }
    return false;
  },

  async createCase(caseData: any): Promise<boolean> {
    const cases = await this.getCases();
    const newId = `CASO-${Math.floor(1000 + Math.random() * 9000)}`;
    const newEntry = {
      ...caseData,
      idCaso: newId,
      id: newId,
      ticketNumber: newId,
      agenteAsignado: MOCK_AGENTES[0],
      agentId: MOCK_AGENTES[0].idAgente,
      agentName: MOCK_AGENTES[0].nombre,
      categoria: { nombre: 'General', slaDias: 2 },
      category: 'General',
      diasAbierto: 0,
      createdAt: new Date().toISOString(),
      historial: [{
        fechaHora: new Date().toISOString(),
        detalle: 'Caso creado manualmente en sistema',
        usuario: this.getUser()?.name || 'Sistema'
      }]
    };
    cases.unshift(newEntry);
    localStorage.setItem('intelfon_cases', JSON.stringify(cases));
    return true;
  },

  async getKPIs(): Promise<KPI> {
    const cases = await this.getCases();
    return {
      totalCases: cases.length,
      slaCompliance: 85,
      csatScore: 4.2
    };
  },

  async validateSession(): Promise<boolean> {
    // Validar que exista usuario Y token
    // Si no hay token, la sesión no es válida aunque haya usuario en localStorage
    const user = this.getUser();
    const token = this.getToken();
    
    if (!user || !token) {
      // Limpiar datos inválidos
      localStorage.removeItem('intelfon_user');
      localStorage.removeItem('intelfon_token');
      return false;
    }
    
    // Validar que el usuario tenga estructura válida
    if (!user.id || !user.name || !user.role) {
      localStorage.removeItem('intelfon_user');
      localStorage.removeItem('intelfon_token');
      return false;
    }
    
    // Validar que el rol sea válido
    if (!['AGENTE', 'SUPERVISOR', 'GERENTE'].includes(user.role)) {
      localStorage.removeItem('intelfon_user');
      localStorage.removeItem('intelfon_token');
      return false;
    }
    
    return true;
  },

  async getAgentes(): Promise<any[]> {
    initStorage();
    const data = localStorage.getItem('intelfon_agents');
    return data ? JSON.parse(data) : MOCK_AGENTES;
  },

  async updateAgente(id: string, data: any): Promise<boolean> {
    const agentes = await this.getAgentes();
    const idx = agentes.findIndex(a => a.idAgente === id);
    if (idx !== -1) {
      agentes[idx] = { ...agentes[idx], ...data };
      localStorage.setItem('intelfon_agents', JSON.stringify(agentes));
      return true;
    }
    return false;
  },

  logout() {
    localStorage.removeItem('intelfon_user');
    localStorage.removeItem('intelfon_token');
    window.location.href = '#/login';
  },

  // Recuperación de contraseña con webhook (escenario: reset_password)
  async requestPasswordReset(email: string): Promise<boolean> {
    const data = await callWebhook('reset_password', { 
      email,
      action: 'request_reset' 
    });
    
    // El webhook puede retornar: { success: boolean, message?: string }
    if (data.success === false) {
      throw new Error(data.message || 'Error al solicitar restablecimiento de contraseña');
    }
    
    return true;
  },

  async verifyResetCode(email: string, code: string): Promise<{ ok: boolean; tempToken?: string }> {
    const data = await callWebhook('reset_password', {
      email,
      code,
      action: 'verify_code'
    });
    
    // El webhook debe retornar: { success: boolean, tempToken?: string, message?: string }
    if (data.success === false) {
      throw new Error(data.message || 'Código de verificación inválido');
    }
    
    if (!data.tempToken) {
      throw new Error('Token temporal no recibido del servidor');
    }
    
    return { 
      ok: true, 
      tempToken: data.tempToken 
    };
  },

  async finalizePasswordReset(email: string, token: string, password: string): Promise<boolean> {
    const data = await callWebhook('reset_password', {
      email,
      tempToken: token,
      password,
      action: 'finalize_reset'
    });
    
    // El webhook debe retornar: { success: boolean, message?: string }
    if (data.success === false) {
      throw new Error(data.message || 'Error al restablecer la contraseña');
    }
    
    return true;
  },

  // Crear nueva cuenta con webhook (escenario: new_account)
  // SOLO el supervisor puede crear cuentas, y DEBE pasar por el webhook de n8n
  async createAccount(email: string, password: string, name: string, additionalData?: any): Promise<User> {
    // Validaciones previas
    if (!email || !email.trim()) {
      throw new Error('El correo electrónico es requerido');
    }
    if (!password || !password.trim() || password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }
    if (!name || !name.trim()) {
      throw new Error('El nombre es requerido');
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error('Formato de correo electrónico inválido');
    }
    
    // Llamar al webhook - NO HAY FALLBACK
    const data = await callWebhook('new_account', {
      email: email.trim(),
      password: password.trim(),
      name: name.trim(),
      ...additionalData
    });
    
    // El webhook debe retornar: { token: string, user: { id, name, role, avatar? } }
    if (!data.token || !data.user) {
      throw new Error('Error al crear la cuenta. La cuenta no pudo ser registrada en el sistema n8n.');
    }

    // Validar estructura completa del usuario
    if (!data.user.id || !data.user.name || !data.user.role) {
      throw new Error('La cuenta fue creada pero no tiene información completa. Contacta al administrador.');
    }

    // Validar que el rol sea válido
    if (!['AGENTE', 'SUPERVISOR', 'GERENTE'].includes(data.user.role)) {
      throw new Error('Rol de usuario inválido. La cuenta debe tener un rol válido asignado.');
    }

    // Almacenar el token JWT
    localStorage.setItem('intelfon_token', data.token);
    
    // Almacenar información del usuario EXACTAMENTE como viene del webhook
    const user: User = {
      id: data.user.id,
      name: data.user.name.trim(),
      role: data.user.role,
      avatar: data.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.name)}&background=0f172a&color=fff`
    };

    localStorage.setItem('intelfon_user', JSON.stringify(user));
    return user;
  }
};
