
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

// Función auxiliar para llamar al webhook de Make.com
// Solo permite operaciones si el webhook responde correctamente
// type: 'login' | 'forgot_password' | 'register'
const callWebhook = async (scenario: 'login' | 'reset_password' | 'new_account', data: any) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  // Mapear scenario a type para Make.com
  const typeMap: Record<'login' | 'reset_password' | 'new_account', string> = {
    'login': 'login',
    'reset_password': 'forgot_password',
    'new_account': 'register'
  };

  const type = typeMap[scenario];

  try {
    const response = await fetch(API_CONFIG.WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        ...data,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const result = await response.json();
    
    // Verificar si hay error en la respuesta (formato de Make.com)
    if (result.error === true) {
      throw new Error(result.message || 'Error en la operación');
    }

    // Si la respuesta no es ok, también tratar como error
    if (!response.ok) {
      throw new Error(result.message || `Error ${response.status}: ${response.statusText}`);
    }

    // Validaciones según el escenario (formato de Make.com)
    if (scenario === 'login' || scenario === 'new_account') {
      // Para login y register, Make.com retorna: { id, name, role, email }
      // NO retorna token ni user anidado
      if (!result.id || !result.name || !result.role) {
        throw new Error('Respuesta del webhook inválida. Faltan datos del usuario.');
      }
      
      // Validar que el rol sea válido
      if (!['AGENTE', 'SUPERVISOR', 'GERENTE'].includes(result.role)) {
        throw new Error('Rol de usuario inválido. La cuenta debe tener un rol válido asignado.');
      }
      
      // Normalizar la respuesta al formato esperado internamente
      return {
        token: `token-${result.id}-${Date.now()}`, // Generar token local basado en el ID
        user: {
          id: result.id,
          name: result.name,
          role: result.role,
          email: result.email,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(result.name)}&background=0f172a&color=fff`
        }
      };
    } else if (scenario === 'reset_password') {
      // Para reset password, validar según la acción
      if (data.action === 'verify_code' && !result.tempToken) {
        throw new Error('Código de verificación inválido o expirado');
      }
      if (result.error === true || result.success === false) {
        throw new Error(result.message || 'Error en la operación de restablecimiento de contraseña');
      }
      return result;
    }
    
    return result;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Timeout: El servidor no respondió a tiempo. Verifica tu conexión.');
    }
    if (error.message) {
      throw error;
    }
    throw new Error('Error de conexión con el servidor. La cuenta debe estar registrada en el sistema.');
  }
};

// Función auxiliar para autenticación con webhook (escenario: login)
// Solo permite acceso si el webhook de ClickUp valida la cuenta
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
    throw new Error('Rol de usuario inválido. La cuenta debe tener un rol válido asignado.');
  }

  // Almacenar el token JWT para futuras peticiones
  localStorage.setItem('intelfon_token', data.token);
  
  // Almacenar información del usuario EXACTAMENTE como viene del webhook
  // NO se permite sobrescribir con mapeos locales - todo debe venir del webhook
  const user: User = {
    id: data.user.id,
    name: data.user.name.trim(),
    role: userRole,
    avatar: data.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.name)}&background=0f172a&color=fff`
  };

  localStorage.setItem('intelfon_user', JSON.stringify(user));
  return user;
};

// Cuentas demo permitidas (solo para desarrollo/pruebas)
// Estas cuentas pueden acceder sin pasar por el webhook
const DEMO_ACCOUNTS: Record<string, { role: Role; name: string }> = {
  'agente@intelfon.com': { role: 'AGENTE', name: 'Agente Demo' },
  'supervisor@intelfon.com': { role: 'SUPERVISOR', name: 'Supervisor Demo' },
  'gerente@intelfon.com': { role: 'GERENTE', name: 'Gerente Demo' },
};

// Función auxiliar para autenticación en modo demo (solo para cuentas demo permitidas)
const authenticateDemo = (email: string): User => {
  initStorage();
  
  const emailLower = (email || '').toLowerCase().trim();
  const demoAccount = DEMO_ACCOUNTS[emailLower];
  
  if (!demoAccount) {
    throw new Error('Cuenta demo no permitida');
  }
  
  const user: User = {
    id: `demo-${demoAccount.role.toLowerCase()}`,
    name: demoAccount.name,
    role: demoAccount.role,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(demoAccount.name)}&background=0f172a&color=fff`
  };

  // Generar un token demo simple
  const demoToken = `demo-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  localStorage.setItem('intelfon_token', demoToken);
  localStorage.setItem('intelfon_user', JSON.stringify(user));
  
  return user;
};

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
    
    const emailLower = email.trim().toLowerCase();
    
    // Verificar si es una cuenta demo permitida
    if (DEMO_ACCOUNTS[emailLower]) {
      // Para cuentas demo, cualquier contraseña es válida
      return authenticateDemo(emailLower);
    }
    
    // Para todas las demás cuentas, DEBEN estar registradas y almacenadas en el sistema
    // El webhook de Make.com verifica si el usuario existe en su base de datos
    // Si el usuario no está almacenado, el webhook retornará un error
    try {
      const user = await authenticateWithWebhook(email.trim(), pass);
      // Si llegamos aquí, el usuario está almacenado en el sistema y las credenciales son correctas
      return user;
    } catch (error: any) {
      // Limpiar cualquier dato previo en caso de error
      localStorage.removeItem('intelfon_user');
      localStorage.removeItem('intelfon_token');
      
      // Mejorar el mensaje de error para indicar claramente si el usuario no está almacenado
      const errorMessage = error.message || 'Error de autenticación';
      if (errorMessage.includes('no registrada') || 
          errorMessage.includes('no encontrado') || 
          errorMessage.includes('no está almacenado') ||
          errorMessage.includes('404')) {
        throw new Error('Usuario no encontrado. El usuario no está almacenado en el sistema. Contacta a tu supervisor para crear una cuenta.');
      }
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

  // Crear nueva cuenta con webhook (type: register)
  // SOLO el supervisor puede crear cuentas, y DEBE pasar por el webhook de Make.com
  // El usuario se almacena directamente en el sistema a través del webhook
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
    
    // Llamar al webhook de Make.com para crear y almacenar el usuario
    // Make.com retorna: { id, name, role, email } cuando es correcto
    // O: { error: true, message: "..." } cuando hay error
    const data = await callWebhook('new_account', {
      email: email.trim().toLowerCase(),
      password: password.trim(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
      ...additionalData
    });
    
    // callWebhook ya normaliza la respuesta, así que esperamos { token, user }
    // Si no hay token o user, significa que el sistema no pudo crear/almacenar el usuario
    if (!data.token || !data.user) {
      throw new Error('Error al crear la cuenta. El usuario no pudo ser almacenado en el sistema. Verifica que el webhook esté configurado correctamente.');
    }

    // Validar estructura completa del usuario almacenado
    if (!data.user.id || !data.user.name || !data.user.role) {
      throw new Error('La cuenta fue creada pero no tiene información completa. El usuario no se almacenó correctamente en el sistema.');
    }

    // Validar que el rol sea válido
    if (!['AGENTE', 'SUPERVISOR', 'GERENTE'].includes(data.user.role)) {
      throw new Error('Rol de usuario inválido. La cuenta debe tener un rol válido asignado.');
    }

    // Almacenar el token (el usuario ya está almacenado en el sistema)
    localStorage.setItem('intelfon_token', data.token);
    
    // Almacenar información del usuario EXACTAMENTE como viene del webhook
    // Esto confirma que el usuario fue almacenado exitosamente
    const user: User = {
      id: data.user.id,
      name: data.user.name.trim(),
      role: data.user.role,
      avatar: data.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.name)}&background=0f172a&color=fff`
    };

    localStorage.setItem('intelfon_user', JSON.stringify(user));
    
    // El usuario ha sido creado y almacenado exitosamente en el sistema
    return user;
  }
};
