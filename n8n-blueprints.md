
# INTELFON - Blueprints n8n

Este documento define la arquitectura de flujos para n8n que servirá como backend para el Sistema de Gestión de Casos SAC.

## WF-001: Autenticación (POST /api/auth/login)
- **Trigger**: Webhook Node (POST, `/auth/login`)
- **Lógica**:
  1. Nodo "HTTP Request" o "Database Search" para buscar usuario por email.
  2. Nodo "Crypto" para comparar hash de password (o validación mock inicial).
  3. Nodo "Function" para generar JWT:
     ```javascript
     const jwt = require('jsonwebtoken');
     const token = jwt.sign({ id, role, email }, 'SECRET_KEY', { expiresIn: '8h' });
     return { token, user };
     ```
- **Response**: JSON con token y perfil.

## WF-010: Entrada Unificada de Casos (POST /api/casos)
- **Trigger**: Webhook Node (POST, `/casos`)
- **Lógica Round-Robin**:
  1. Obtener lista de agentes `Activos` ordenados por `ordenRoundRobin`.
  2. Nodo "Wait" o "Storage" para leer `ULTIMO_AGENTE_ASIGNADO`.
  3. Determinar el siguiente ID en la lista circular.
  4. Crear registro en BD (Postgres/Sheets/Airtable).
  5. Registrar en `HistorialCaso` la creación y la asignación.
- **Notificación**: Nodo "Gmail" o "Twilio" enviando confirmación según `canalNotificacion`.

## WF-020: Máquina de Estados (PATCH /api/casos/:id/estado)
- **Trigger**: Webhook Node (PATCH, `/casos/:id/estado`)
- **Validación RCR (Rol-Caso-Regla)**:
  1. Verificar validez del JWT.
  2. Nodo "Switch" para validar transición permitida según `STATE_TRANSITIONS`.
  3. Si es válido, actualizar estado y `fechaActualizacion`.
- **Lógica Condicional**:
  - `Resuelto`: Disparar nodo "Wait" (24h) y luego enviar encuesta CSAT.
  - `Cerrado`: Finalizar workflow y bloquear futuras ediciones.

## WF-030: Monitor de SLA (Scheduler)
- **Trigger**: Cron Node (Cada 1 hora)
- **Lógica**:
  1. Consultar todos los casos con estado != `Cerrado` y != `Pendiente Cliente`.
  2. Calcular `diff(now, fechaCreacion)`.
  3. **Alertas**:
     - 75% del SLA: Email a Supervisor.
     - 100% del SLA: Email Urgente a Supervisor + Agente.
     - 100% + AlertaGerente: Marcar como `Escalado` automáticamente y notificar a Gerente.

## Seguridad: Validación de Rol en n8n
Todos los Webhooks deben comenzar con un nodo "JWT Validation" (Function Node):
```javascript
try {
  const authHeader = $node["Webhook"].json.headers.authorization;
  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, 'SECRET_KEY');
  // Inyectar info de usuario al flujo
  return { ...$json, authUser: decoded };
} catch (e) {
  throw new Error("No autorizado");
}
```
