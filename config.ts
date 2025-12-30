// Configuración de la API y Webhooks
export const API_CONFIG = {
  // URL del webhook de n8n para autenticación y gestión de usuarios
  // Usa la URL directa siempre - el servidor n8n debe permitir CORS
  WEBHOOK_URL: import.meta.env.VITE_WEBHOOK_URL || 'https://n8n.red.com.sv/webhook/6f27bb4b-bfcd-4776-b554-5194569be2a7',
  
  // URL del webhook de n8n para almacenar/actualizar agentes (entorno de pruebas)
  WEBHOOK_AGENTES_URL: import.meta.env.VITE_WEBHOOK_AGENTES_URL || 'https://n8n.red.com.sv/webhook-test/d804c804-9841-41f7-bc4b-66d2edeed53b',
  
  // URL del webhook de n8n para la gestión de casos (CRUD)
  WEBHOOK_CASOS_URL: import.meta.env.VITE_WEBHOOK_CASOS_URL || 'https://n8n.red.com.sv/webhook-test/97a6c0f7-ea50-4542-b99e-710b96b58652',
  
  // URL del webhook de n8n para Round Robin de agentes
  WEBHOOK_ROUND_ROBIN_URL: import.meta.env.VITE_WEBHOOK_ROUND_ROBIN_URL || 'https://n8n.red.com.sv/webhook-test/case-create-round-robin',
  
  // Timeout para las peticiones (en milisegundos)
  TIMEOUT: 30000,
  
  // Modo demo: deshabilitado - solo se permite acceso con webhook
  DEMO_MODE_FALLBACK: false,
};

