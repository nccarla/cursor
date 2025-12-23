// Configuración de la API y Webhooks
export const API_CONFIG = {
  // URL del webhook de n8n para autenticación y gestión de usuarios
  // Usa la URL directa siempre - el servidor n8n debe permitir CORS
  WEBHOOK_URL: import.meta.env.VITE_WEBHOOK_URL || 'https://n8n.red.com.sv/webhook/6f27bb4b-bfcd-4776-b554-5194569be2a7',
  
  // URL del webhook de n8n para almacenar/actualizar agentes (entorno de pruebas)
  WEBHOOK_AGENTES_URL: import.meta.env.VITE_WEBHOOK_AGENTES_URL || 'https://n8n.red.com.sv/webhook-test/d804c804-9841-41f7-bc4b-66d2edeed53b',
  
  // Timeout para las peticiones (en milisegundos)
  TIMEOUT: 30000,
  
  // Modo demo: deshabilitado - solo se permite acceso con webhook
  DEMO_MODE_FALLBACK: false,
};

