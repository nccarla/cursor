// Servicio temporal de correo para desarrollo y testing
// Almacena códigos de recuperación en localStorage y simula el envío de correos

interface EmailRecord {
  email: string;
  code: string;
  timestamp: number;
  expiresAt: number;
  used: boolean;
  type: 'password_reset' | 'verification';
}

interface SentEmail {
  id: string;
  to: string;
  subject: string;
  body: string;
  timestamp: number;
  type: 'password_reset' | 'verification' | 'welcome';
  metadata?: {
    code?: string;
    expiresAt?: number;
  };
}

const STORAGE_KEY = 'intelfon_email_codes';
const EMAILS_STORAGE_KEY = 'intelfon_sent_emails';
const CODE_EXPIRATION_TIME = 15 * 60 * 1000; // 15 minutos
const CODE_LENGTH = 6;
const MAX_STORED_EMAILS = 50; // Máximo de correos a almacenar

// Generar código aleatorio de 6 dígitos
const generateCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Obtener todos los códigos almacenados
const getStoredCodes = (): EmailRecord[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error al leer códigos almacenados:', error);
    return [];
  }
};

// Guardar códigos en localStorage
const saveCodes = (codes: EmailRecord[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
  } catch (error) {
    console.error('Error al guardar códigos:', error);
  }
};

// Limpiar códigos expirados
const cleanExpiredCodes = (): void => {
  const codes = getStoredCodes();
  const now = Date.now();
  const validCodes = codes.filter(code => code.expiresAt > now);
  saveCodes(validCodes);
};

// Obtener correos enviados
const getSentEmails = (): SentEmail[] => {
  try {
    const stored = localStorage.getItem(EMAILS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error al leer correos enviados:', error);
    return [];
  }
};

// Guardar correos enviados
const saveSentEmails = (emails: SentEmail[]): void => {
  try {
    // Mantener solo los últimos MAX_STORED_EMAILS correos
    const sorted = emails.sort((a, b) => b.timestamp - a.timestamp);
    const limited = sorted.slice(0, MAX_STORED_EMAILS);
    localStorage.setItem(EMAILS_STORAGE_KEY, JSON.stringify(limited));
  } catch (error) {
    console.error('Error al guardar correos enviados:', error);
  }
};

// Generar plantilla de correo de recuperación
const generatePasswordResetEmail = (email: string, code: string, expiresAt: number): { subject: string; body: string } => {
  const expiresDate = new Date(expiresAt).toLocaleString('es-ES', {
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const subject = 'Código de Recuperación de Contraseña - Intelfon';
  
  const body = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .code-box { background: white; border: 2px solid #1e293b; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
    .code { font-size: 32px; font-weight: bold; color: #1e293b; letter-spacing: 8px; font-family: monospace; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Recuperación de Contraseña</h1>
    </div>
    <div class="content">
      <p>Hola,</p>
      <p>Has solicitado restablecer tu contraseña en el Sistema de Gestión de Casos de Intelfon.</p>
      
      <div class="code-box">
        <p style="margin: 0 0 10px 0; color: #666;">Tu código de verificación es:</p>
        <div class="code">${code}</div>
      </div>
      
      <div class="warning">
        <strong>⚠️ Importante:</strong> Este código expirará el ${expiresDate}. Si no solicitaste este código, ignora este correo.
      </div>
      
      <p>Ingresa este código en la página de verificación para continuar con el proceso de recuperación de contraseña.</p>
      
      <p>Si tienes problemas, contacta al administrador del sistema.</p>
      
      <p>Saludos,<br><strong>Equipo Intelfon</strong></p>
    </div>
    <div class="footer">
      <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
      <p>© ${new Date().getFullYear()} Intelfon - Sistema de Gestión de Casos</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, body };
};

export const emailService = {
  // Enviar código de recuperación de contraseña
  // Solo genera un nuevo código si no existe uno válido pendiente
  // Si forceNew es false y ya existe un código válido, no genera uno nuevo
  sendPasswordResetCode(email: string, forceNew: boolean = false): { code: string; expiresAt: number; isNew: boolean } {
    cleanExpiredCodes();
    
    const emailLower = email.toLowerCase().trim();
    const codes = getStoredCodes();
    const now = Date.now();
    
    // Buscar si ya existe un código válido pendiente para este email
    if (!forceNew) {
      const existingCode = codes.find(
        c => 
          c.email === emailLower &&
          c.type === 'password_reset' &&
          !c.used &&
          c.expiresAt > now
      );
      
      if (existingCode) {
        console.log('📧 [EMAIL SERVICE] Ya existe un código válido pendiente para este email');
        console.log('   🔑 Código existente:', existingCode.code);
        console.log('   ⏰ Expira:', new Date(existingCode.expiresAt).toLocaleString('es-ES'));
        console.log('   ℹ️ No se enviará un nuevo correo. Usa el código existente.');
        
        return {
          code: existingCode.code,
          expiresAt: existingCode.expiresAt,
          isNew: false
        };
      }
    }
    
    // Si no hay código válido o se fuerza uno nuevo, generar uno
    console.log('📧 [EMAIL SERVICE] Generando nuevo código de recuperación');
    
    // Marcar todos los códigos anteriores del mismo email como usados
    codes.forEach(c => {
      if (c.email === emailLower && c.type === 'password_reset' && !c.used) {
        c.used = true;
        console.log('   🗑️ Código anterior marcado como usado:', c.code);
      }
    });
    
    // Generar nuevo código
    const code = generateCode();
    const expiresAt = now + CODE_EXPIRATION_TIME;
    
    const record: EmailRecord = {
      email: emailLower,
      code,
      timestamp: now,
      expiresAt,
      used: false,
      type: 'password_reset',
    };
    
    // Agregar nuevo código
    codes.push(record);
    saveCodes(codes);
    
    // Generar y almacenar el correo enviado
    const { subject, body } = generatePasswordResetEmail(email, code, expiresAt);
    const sentEmail: SentEmail = {
      id: `email-${now}-${Math.random().toString(36).substr(2, 9)}`,
      to: email,
      subject,
      body,
      timestamp: now,
      type: 'password_reset',
      metadata: {
        code,
        expiresAt,
      },
    };
    
    const sentEmails = getSentEmails();
    sentEmails.push(sentEmail);
    saveSentEmails(sentEmails);
    
    // Log detallado para desarrollo
    console.group('📧 [EMAIL SERVICE] Correo de recuperación enviado');
    console.log('📬 Para:', email);
    console.log('📋 Asunto:', subject);
    console.log('🔑 Código:', code);
    console.log('⏰ Expira:', new Date(expiresAt).toLocaleString('es-ES'));
    console.log('📝 ID del correo:', sentEmail.id);
    console.log('⚠️ Este es un servicio temporal. En producción, el correo se enviaría automáticamente.');
    console.log('💡 Puedes ver todos los correos enviados con: emailService.getAllSentEmails()');
    console.groupEnd();
    
    return { code, expiresAt, isNew: true };
  },

  // Verificar código de recuperación
  verifyCode(email: string, code: string): { valid: boolean; tempToken?: string; message?: string } {
    cleanExpiredCodes();
    
    const codes = getStoredCodes();
    const now = Date.now();
    const emailLower = email.toLowerCase().trim();
    
    // Buscar código válido
    const record = codes.find(
      c => 
        c.email === emailLower &&
        c.code === code &&
        !c.used &&
        c.expiresAt > now &&
        c.type === 'password_reset'
    );
    
    if (!record) {
      // Verificar si el código existe pero está expirado
      const expiredRecord = codes.find(
        c => c.email === emailLower && c.code === code && c.type === 'password_reset'
      );
      
      if (expiredRecord && expiredRecord.expiresAt <= now) {
        return { valid: false, message: 'El código ha expirado. Solicita uno nuevo.' };
      }
      
      if (expiredRecord && expiredRecord.used) {
        return { valid: false, message: 'Este código ya fue utilizado.' };
      }
      
      return { valid: false, message: 'Código inválido. Verifica que sea correcto.' };
    }
    
    // Marcar código como usado
    record.used = true;
    saveCodes(codes);
    
    // Generar token temporal
    const tempToken = `temp-${record.email}-${Date.now()}`;
    
    console.log('✅ [EMAIL SERVICE] Código verificado correctamente');
    console.log('   Email:', email);
    console.log('   Token temporal generado');
    
    return { valid: true, tempToken };
  },

  // Obtener código más reciente válido para un email (solo para desarrollo/testing)
  getLatestCode(email: string): { code: string; expiresAt: number } | null {
    cleanExpiredCodes();
    
    const codes = getStoredCodes();
    const emailLower = email.toLowerCase().trim();
    const now = Date.now();
    
    // Buscar el código más reciente que esté válido (no usado y no expirado)
    const validRecords = codes
      .filter(c => 
        c.email === emailLower && 
        c.type === 'password_reset' &&
        !c.used &&
        c.expiresAt > now
      )
      .sort((a, b) => b.timestamp - a.timestamp);
    
    if (validRecords.length === 0) {
      // Si no hay códigos válidos, buscar el más reciente (aunque esté expirado o usado)
      const allRecords = codes
        .filter(c => c.email === emailLower && c.type === 'password_reset')
        .sort((a, b) => b.timestamp - a.timestamp);
      
      if (allRecords.length === 0) {
        return null;
      }
      
      const latest = allRecords[0];
      console.warn('⚠️ El código más reciente está expirado o usado:', latest.code);
      return {
        code: latest.code,
        expiresAt: latest.expiresAt,
      };
    }
    
    const latest = validRecords[0];
    return {
      code: latest.code,
      expiresAt: latest.expiresAt,
    };
  },

  // Obtener todos los códigos (solo para desarrollo/testing)
  getAllCodes(): EmailRecord[] {
    cleanExpiredCodes();
    return getStoredCodes();
  },

  // Limpiar todos los códigos (útil para testing)
  clearAllCodes(): void {
    localStorage.removeItem(STORAGE_KEY);
    console.log('🗑️ [EMAIL SERVICE] Todos los códigos han sido eliminados');
  },

  // Obtener todos los correos enviados (solo para desarrollo/testing)
  getAllSentEmails(): SentEmail[] {
    return getSentEmails();
  },

  // Obtener correos enviados a un email específico
  getSentEmailsFor(email: string): SentEmail[] {
    const emails = getSentEmails();
    const emailLower = email.toLowerCase().trim();
    return emails.filter(e => e.to.toLowerCase() === emailLower);
  },

  // Obtener el último correo enviado a un email
  getLatestSentEmail(email: string): SentEmail | null {
    const emails = this.getSentEmailsFor(email);
    if (emails.length === 0) return null;
    return emails.sort((a, b) => b.timestamp - a.timestamp)[0];
  },

  // Limpiar todos los correos enviados (útil para testing)
  clearAllSentEmails(): void {
    localStorage.removeItem(EMAILS_STORAGE_KEY);
    console.log('🗑️ [EMAIL SERVICE] Todos los correos enviados han sido eliminados');
  },

  // Mostrar resumen de correos en consola (útil para desarrollo)
  showEmailSummary(): void {
    const emails = getSentEmails();
    console.group('📊 [EMAIL SERVICE] Resumen de correos enviados');
    console.log(`Total de correos: ${emails.length}`);
    
    if (emails.length > 0) {
      const byType = emails.reduce((acc, email) => {
        acc[email.type] = (acc[email.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log('Por tipo:', byType);
      console.log('Últimos 5 correos:');
      emails
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5)
        .forEach((email, idx) => {
          console.log(`  ${idx + 1}. [${new Date(email.timestamp).toLocaleString()}] ${email.type} → ${email.to}`);
        });
    }
    console.groupEnd();
  },
};
