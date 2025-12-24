-- ============================================
-- SCHEMA DE SUPABASE PARA SISTEMA SAC (Intelfon)
-- ============================================

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: users (Usuarios del sistema)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('AGENTE', 'SUPERVISOR', 'GERENTE')),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.users(id),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para la tabla users
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- ============================================
-- TABLA: password_reset_codes (Códigos de recuperación)
-- ============================================
CREATE TABLE IF NOT EXISTS public.password_reset_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE
);

-- Índices para password_reset_codes
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_user_id ON public.password_reset_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_code ON public.password_reset_codes(code);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_expires_at ON public.password_reset_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_used ON public.password_reset_codes(used);

-- ============================================
-- TABLA: cases (Casos del sistema)
-- ============================================
CREATE TABLE IF NOT EXISTS public.cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_number VARCHAR(50) UNIQUE NOT NULL,
    subject TEXT NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL CHECK (status IN ('ABIERTO', 'EN_PROCESO', 'ESCALADO', 'RESUELTO', 'CERRADO')),
    priority VARCHAR(50) NOT NULL CHECK (priority IN ('BAJA', 'MEDIA', 'ALTA', 'CRITICA')),
    category_id UUID,
    assigned_agent_id UUID REFERENCES public.users(id),
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    sla_days INTEGER DEFAULT 7,
    days_open INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para cases
CREATE INDEX IF NOT EXISTS idx_cases_case_number ON public.cases(case_number);
CREATE INDEX IF NOT EXISTS idx_cases_status ON public.cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_priority ON public.cases(priority);
CREATE INDEX IF NOT EXISTS idx_cases_assigned_agent_id ON public.cases(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON public.cases(created_at);
CREATE INDEX IF NOT EXISTS idx_cases_category_id ON public.cases(category_id);

-- ============================================
-- TABLA: categories (Categorías de casos)
-- ============================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sla_days INTEGER DEFAULT 7,
    color VARCHAR(7),
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para categories
CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories(is_active);

-- ============================================
-- TABLA: case_comments (Comentarios en casos)
-- ============================================
CREATE TABLE IF NOT EXISTS public.case_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id),
    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para case_comments
CREATE INDEX IF NOT EXISTS idx_case_comments_case_id ON public.case_comments(case_id);
CREATE INDEX IF NOT EXISTS idx_case_comments_user_id ON public.case_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_case_comments_created_at ON public.case_comments(created_at);

-- ============================================
-- TABLA: case_history (Historial de cambios en casos)
-- ============================================
CREATE TABLE IF NOT EXISTS public.case_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id),
    action VARCHAR(100) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para case_history
CREATE INDEX IF NOT EXISTS idx_case_history_case_id ON public.case_history(case_id);
CREATE INDEX IF NOT EXISTS idx_case_history_user_id ON public.case_history(user_id);
CREATE INDEX IF NOT EXISTS idx_case_history_created_at ON public.case_history(created_at);

-- ============================================
-- TABLA: agent_status (Estado de agentes)
-- ============================================
CREATE TABLE IF NOT EXISTS public.agent_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Online', 'Offline', 'Ocupado', 'Ausente', 'Vacaciones')),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_cases_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para agent_status
CREATE INDEX IF NOT EXISTS idx_agent_status_user_id ON public.agent_status(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_status_status ON public.agent_status(status);

-- ============================================
-- TABLA: sent_emails (Registro de correos enviados)
-- ============================================
CREATE TABLE IF NOT EXISTS public.sent_emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    to_email VARCHAR(255) NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    email_type VARCHAR(50) NOT NULL CHECK (email_type IN ('password_reset', 'verification', 'welcome', 'notification')),
    status VARCHAR(50) DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para sent_emails
CREATE INDEX IF NOT EXISTS idx_sent_emails_to_email ON public.sent_emails(to_email);
CREATE INDEX IF NOT EXISTS idx_sent_emails_email_type ON public.sent_emails(email_type);
CREATE INDEX IF NOT EXISTS idx_sent_emails_created_at ON public.sent_emails(created_at);
CREATE INDEX IF NOT EXISTS idx_sent_emails_status ON public.sent_emails(status);

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON public.cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_case_comments_updated_at BEFORE UPDATE ON public.case_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_status_updated_at BEFORE UPDATE ON public.agent_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para calcular días abiertos de un caso
CREATE OR REPLACE FUNCTION calculate_case_days_open()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status NOT IN ('RESUELTO', 'CERRADO') THEN
        NEW.days_open = EXTRACT(DAY FROM (NOW() - NEW.created_at))::INTEGER;
    ELSE
        NEW.days_open = EXTRACT(DAY FROM (COALESCE(NEW.resolved_at, NEW.closed_at, NOW()) - NEW.created_at))::INTEGER;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para calcular días abiertos
CREATE TRIGGER calculate_case_days_open_trigger BEFORE INSERT OR UPDATE ON public.cases
    FOR EACH ROW EXECUTE FUNCTION calculate_case_days_open();

-- Función para actualizar contador de casos del agente
CREATE OR REPLACE FUNCTION update_agent_case_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.agent_status
        SET current_cases_count = (
            SELECT COUNT(*) FROM public.cases
            WHERE assigned_agent_id = NEW.assigned_agent_id
            AND status NOT IN ('RESUELTO', 'CERRADO')
        )
        WHERE user_id = NEW.assigned_agent_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Actualizar contador del agente anterior si cambió
        IF OLD.assigned_agent_id IS DISTINCT FROM NEW.assigned_agent_id THEN
            UPDATE public.agent_status
            SET current_cases_count = (
                SELECT COUNT(*) FROM public.cases
                WHERE assigned_agent_id = OLD.assigned_agent_id
                AND status NOT IN ('RESUELTO', 'CERRADO')
            )
            WHERE user_id = OLD.assigned_agent_id;
        END IF;
        -- Actualizar contador del nuevo agente
        IF NEW.assigned_agent_id IS NOT NULL THEN
            UPDATE public.agent_status
            SET current_cases_count = (
                SELECT COUNT(*) FROM public.cases
                WHERE assigned_agent_id = NEW.assigned_agent_id
                AND status NOT IN ('RESUELTO', 'CERRADO')
            )
            WHERE user_id = NEW.assigned_agent_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger para actualizar contador de casos
CREATE TRIGGER update_agent_case_count_trigger AFTER INSERT OR UPDATE ON public.cases
    FOR EACH ROW EXECUTE FUNCTION update_agent_case_count();

-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sent_emails ENABLE ROW LEVEL SECURITY;

-- Políticas para users
CREATE POLICY "Users can view their own data"
    ON public.users FOR SELECT
    USING (auth.uid()::text = id::text OR auth.jwt() ->> 'role' IN ('SUPERVISOR', 'GERENTE'));

CREATE POLICY "Supervisors and managers can view all users"
    ON public.users FOR SELECT
    USING (auth.jwt() ->> 'role' IN ('SUPERVISOR', 'GERENTE'));

CREATE POLICY "Supervisors can create users"
    ON public.users FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'SUPERVISOR');

CREATE POLICY "Users can update their own data"
    ON public.users FOR UPDATE
    USING (auth.uid()::text = id::text OR auth.jwt() ->> 'role' IN ('SUPERVISOR', 'GERENTE'));

-- Políticas para cases
CREATE POLICY "Agents can view assigned cases"
    ON public.cases FOR SELECT
    USING (
        assigned_agent_id::text = auth.uid()::text
        OR auth.jwt() ->> 'role' IN ('SUPERVISOR', 'GERENTE')
    );

CREATE POLICY "Agents can create cases"
    ON public.cases FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' IN ('AGENTE', 'SUPERVISOR', 'GERENTE'));

CREATE POLICY "Agents can update assigned cases"
    ON public.cases FOR UPDATE
    USING (
        assigned_agent_id::text = auth.uid()::text
        OR auth.jwt() ->> 'role' IN ('SUPERVISOR', 'GERENTE')
    );

-- Políticas para categories
CREATE POLICY "All authenticated users can view categories"
    ON public.categories FOR SELECT
    USING (auth.role() = 'authenticated');

-- Políticas para case_comments
CREATE POLICY "Users can view comments on accessible cases"
    ON public.case_comments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.cases
            WHERE cases.id = case_comments.case_id
            AND (
                cases.assigned_agent_id::text = auth.uid()::text
                OR auth.jwt() ->> 'role' IN ('SUPERVISOR', 'GERENTE')
            )
        )
    );

CREATE POLICY "Users can create comments"
    ON public.case_comments FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Políticas para agent_status
CREATE POLICY "Users can view agent status"
    ON public.agent_status FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Agents can update their own status"
    ON public.agent_status FOR UPDATE
    USING (user_id::text = auth.uid()::text);

-- ============================================
-- DATOS INICIALES (Opcional)
-- ============================================

-- Insertar categorías por defecto
INSERT INTO public.categories (name, description, sla_days, color, icon) VALUES
    ('Soporte Técnico', 'Problemas técnicos y de infraestructura', 5, '#1e293b', 'wrench'),
    ('Facturación', 'Consultas y problemas de facturación', 3, '#c8151b', 'dollar-sign'),
    ('Ventas', 'Consultas comerciales y nuevas ventas', 2, '#334155', 'shopping-cart'),
    ('General', 'Consultas generales', 7, '#afacb2', 'help-circle')
ON CONFLICT DO NOTHING;

-- ============================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ============================================

COMMENT ON TABLE public.users IS 'Tabla principal de usuarios del sistema';
COMMENT ON COLUMN public.users.role IS 'Rol del usuario: AGENTE, SUPERVISOR, GERENTE';
COMMENT ON COLUMN public.users.password_hash IS 'Hash de la contraseña (usar bcrypt)';
COMMENT ON COLUMN public.users.metadata IS 'Datos adicionales en formato JSON';

COMMENT ON TABLE public.cases IS 'Casos o tickets del sistema';
COMMENT ON COLUMN public.cases.status IS 'Estado: ABIERTO, EN_PROCESO, ESCALADO, RESUELTO, CERRADO';
COMMENT ON COLUMN public.cases.priority IS 'Prioridad: BAJA, MEDIA, ALTA, CRITICA';

COMMENT ON TABLE public.password_reset_codes IS 'Códigos de recuperación de contraseña';
COMMENT ON COLUMN public.password_reset_codes.code IS 'Código de 6 dígitos';
COMMENT ON COLUMN public.password_reset_codes.expires_at IS 'Fecha de expiración del código';

COMMENT ON TABLE public.sent_emails IS 'Registro de correos electrónicos enviados';
COMMENT ON COLUMN public.sent_emails.email_type IS 'Tipo: password_reset, verification, welcome, notification';



