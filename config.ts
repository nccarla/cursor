// Configuración de la API y Webhooks
export const API_CONFIG = {
  // URL del webhook de autenticación (Make.com)
  // Puedes configurarlo mediante variable de entorno o usar una URL por defecto
  WEBHOOK_URL: import.meta.env.VITE_WEBHOOK_URL || 'https://hook.eu2.make.com/t2uyeo6ia0u13ms076nh4nhb6hsjbp2g',
  
  // Timeout para las peticiones (en milisegundos)
  TIMEOUT: 10000,
  
  // Modo demo: si es true, usa datos mock si el webhook falla
  DEMO_MODE_FALLBACK: import.meta.env.VITE_DEMO_MODE !== 'false',
};

