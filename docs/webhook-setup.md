# Configuración de Webhook para Login

Este documento explica cómo configurar el webhook de autenticación para el sistema INTELFON SAC.

## Configuración del Webhook

### 1. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con la siguiente configuración:

```env
# URL del webhook de autenticación (n8n)
VITE_WEBHOOK_URL=http://localhost:5678/webhook/auth/login

# Modo demo: 'true' para usar fallback a modo demo si el webhook falla
VITE_DEMO_MODE=true
```

**Nota:** Si estás usando n8n en producción, reemplaza la URL con la URL real de tu webhook.

### 2. Formato Esperado del Webhook

El webhook debe recibir una petición POST con el siguiente formato:

**Request:**
```json
{
  "email": "usuario@intelfon.com",
  "password": "contraseña123"
}
```

**Response (éxito - 200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "name": "Juan Agente",
    "role": "AGENTE",
    "avatar": "https://ejemplo.com/avatar.jpg" // opcional
  }
}
```

**Response (error - 401/400):**
```json
{
  "message": "Credenciales inválidas"
}
```

### 3. Configuración en n8n

Según el archivo `n8n-blueprints.md`, el webhook debe:

1. **Recibir** la petición POST en `/webhook/auth/login`
2. **Validar** las credenciales (buscar usuario por email y comparar password)
3. **Generar** un JWT con la información del usuario
4. **Retornar** el token y la información del usuario

Ejemplo de workflow en n8n:
- **Webhook Node**: POST `/auth/login`
- **Function Node**: Validar credenciales y generar JWT
- **Respond to Webhook Node**: Retornar `{ token, user }`

### 4. Modo Demo (Fallback)

Si `VITE_DEMO_MODE=true` (por defecto), el sistema usará datos mock si:
- El webhook no está disponible
- Hay un error de conexión
- El servidor no responde a tiempo

Para deshabilitar el modo demo y forzar el uso del webhook:
```env
VITE_DEMO_MODE=false
```

### 5. Verificación

Para verificar que el webhook está funcionando:

1. Asegúrate de que n8n esté corriendo y el webhook esté activo
2. Verifica la URL en el archivo `.env`
3. Intenta hacer login desde la aplicación
4. Revisa la consola del navegador para ver si hay errores

### 6. Solución de Problemas

**Error: "Timeout: El servidor no respondió a tiempo"**
- Verifica que el webhook esté activo en n8n
- Verifica que la URL sea correcta
- Aumenta el timeout en `config.ts` si es necesario

**Error: "Respuesta del webhook inválida"**
- Verifica que el webhook retorne `token` y `user` en la respuesta
- Verifica el formato JSON de la respuesta

**Error: "Error de conexión con el servidor"**
- Verifica que n8n esté corriendo
- Verifica la configuración CORS si el webhook está en otro dominio
- Verifica la conectividad de red


