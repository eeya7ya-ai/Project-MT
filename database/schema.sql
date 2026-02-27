-- ============================================================
-- Project-MT PostgreSQL Schema
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'dispatcher', 'technician');
CREATE TYPE project_status AS ENUM ('draft', 'active', 'in_progress', 'completed', 'cancelled');
CREATE TYPE module_type AS ENUM ('survey', 'maintenance', 'installation', 'programming_handover', 'handover');
CREATE TYPE item_status AS ENUM ('pending', 'in_progress', 'completed', 'failed', 'skipped');
CREATE TYPE assignment_status AS ENUM ('assigned', 'accepted', 'rejected', 'completed');
CREATE TYPE file_category AS ENUM ('photo', 'document', 'signature', 'excel', 'other');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'critical');

-- ============================================================
-- CLIENTS
-- ============================================================

CREATE TABLE clients (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255),
    phone       VARCHAR(50),
    address     TEXT,
    city        VARCHAR(100),
    country     VARCHAR(100) DEFAULT 'UAE',
    notes       TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clients_name ON clients(name);

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    phone           VARCHAR(50),
    role            user_role NOT NULL DEFAULT 'technician',
    avatar_url      VARCHAR(500),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================
-- PROJECTS
-- ============================================================

CREATE TABLE projects (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    project_number  VARCHAR(100) NOT NULL UNIQUE,
    name            VARCHAR(500) NOT NULL,
    description     TEXT,
    location        VARCHAR(500),
    latitude        DECIMAL(10, 8),
    longitude       DECIMAL(11, 8),
    status          project_status NOT NULL DEFAULT 'draft',
    priority        priority_level NOT NULL DEFAULT 'medium',
    start_date      DATE,
    due_date        DATE,
    completed_at    TIMESTAMPTZ,
    created_by      UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_number ON projects(project_number);

-- ============================================================
-- PROJECT ASSIGNMENTS
-- ============================================================

CREATE TABLE project_assignments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_by     UUID NOT NULL REFERENCES users(id),
    status          assignment_status NOT NULL DEFAULT 'assigned',
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at    TIMESTAMPTZ,
    notes           TEXT,
    UNIQUE(project_id, user_id)
);

CREATE INDEX idx_assignments_project ON project_assignments(project_id);
CREATE INDEX idx_assignments_user ON project_assignments(user_id);

-- ============================================================
-- ATTACHMENTS (generic file store)
-- ============================================================

CREATE TABLE attachments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
    uploaded_by     UUID NOT NULL REFERENCES users(id),
    file_name       VARCHAR(500) NOT NULL,
    file_url        VARCHAR(1000) NOT NULL,
    file_size       BIGINT,          -- bytes
    mime_type       VARCHAR(100),
    category        file_category NOT NULL DEFAULT 'other',
    entity_type     VARCHAR(100),    -- e.g. 'survey_item', 'maintenance_item'
    entity_id       UUID,            -- FK to any module item
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attachments_project ON attachments(project_id);
CREATE INDEX idx_attachments_entity ON attachments(entity_type, entity_id);

-- ============================================================
-- SURVEY MODULE
-- ============================================================

CREATE TABLE survey_modules (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title           VARCHAR(500) NOT NULL DEFAULT 'Site Survey',
    description     TEXT,
    site_name       VARCHAR(255),
    site_address    TEXT,
    surveyor_notes  TEXT,
    is_completed    BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at    TIMESTAMPTZ,
    completed_by    UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id)
);

CREATE INDEX idx_survey_modules_project ON survey_modules(project_id);

CREATE TABLE survey_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_module_id UUID NOT NULL REFERENCES survey_modules(id) ON DELETE CASCADE,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    item_code       VARCHAR(100),
    description     TEXT NOT NULL,
    quantity        DECIMAL(10, 3),
    unit            VARCHAR(50),
    condition       VARCHAR(100),      -- e.g. Good / Fair / Poor
    remarks         TEXT,
    is_existing     BOOLEAN DEFAULT TRUE,
    status          item_status NOT NULL DEFAULT 'pending',
    completed_by    UUID REFERENCES users(id),
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_survey_items_module ON survey_items(survey_module_id);

-- ============================================================
-- MAINTENANCE MODULE
-- ============================================================

CREATE TABLE maintenance_modules (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title           VARCHAR(500) NOT NULL DEFAULT 'Maintenance',
    description     TEXT,
    maintenance_type VARCHAR(100),      -- Preventive / Corrective / Emergency
    scheduled_date  DATE,
    frequency       VARCHAR(100),       -- Monthly / Quarterly / Annual
    contract_ref    VARCHAR(255),
    is_completed    BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at    TIMESTAMPTZ,
    completed_by    UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_maintenance_modules_project ON maintenance_modules(project_id);

CREATE TABLE maintenance_items (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    maintenance_module_id UUID NOT NULL REFERENCES maintenance_modules(id) ON DELETE CASCADE,
    sort_order          INTEGER NOT NULL DEFAULT 0,
    item_code           VARCHAR(100),
    asset_tag           VARCHAR(100),
    description         TEXT NOT NULL,
    task_description    TEXT,
    quantity            DECIMAL(10, 3),
    unit                VARCHAR(50),
    parts_required      TEXT,
    parts_available     BOOLEAN,
    labor_hours         DECIMAL(6, 2),
    status              item_status NOT NULL DEFAULT 'pending',
    technician_notes    TEXT,
    completed_by        UUID REFERENCES users(id),
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_maintenance_items_module ON maintenance_items(maintenance_module_id);

-- ============================================================
-- INSTALLATION MODULE
-- ============================================================

CREATE TABLE installation_modules (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title           VARCHAR(500) NOT NULL DEFAULT 'Installation',
    description     TEXT,
    system_type     VARCHAR(255),   -- CCTV / Access Control / Fire Alarm / etc.
    floor_plan_url  VARCHAR(1000),
    is_completed    BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at    TIMESTAMPTZ,
    completed_by    UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_installation_modules_project ON installation_modules(project_id);

CREATE TABLE installation_items (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    installation_module_id  UUID NOT NULL REFERENCES installation_modules(id) ON DELETE CASCADE,
    sort_order              INTEGER NOT NULL DEFAULT 0,
    item_code               VARCHAR(100),
    part_number             VARCHAR(100),
    description             TEXT NOT NULL,
    brand                   VARCHAR(100),
    model                   VARCHAR(100),
    quantity                DECIMAL(10, 3) NOT NULL DEFAULT 1,
    unit                    VARCHAR(50),
    location_zone           VARCHAR(255),
    floor_level             VARCHAR(100),
    installation_notes      TEXT,
    is_tested               BOOLEAN DEFAULT FALSE,
    test_result             VARCHAR(100),
    status                  item_status NOT NULL DEFAULT 'pending',
    technician_notes        TEXT,
    completed_by            UUID REFERENCES users(id),
    completed_at            TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_installation_items_module ON installation_items(installation_module_id);

-- ============================================================
-- PROGRAMMING & HANDOVER MODULE
-- ============================================================

CREATE TABLE programming_handover_modules (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title           VARCHAR(500) NOT NULL DEFAULT 'Programming & Handover',
    description     TEXT,
    software_version VARCHAR(100),
    license_key     VARCHAR(500),
    server_ip       VARCHAR(100),
    server_port     INTEGER,
    training_notes  TEXT,
    is_completed    BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at    TIMESTAMPTZ,
    completed_by    UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prog_handover_modules_project ON programming_handover_modules(project_id);

CREATE TABLE programming_handover_items (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    programming_handover_module_id UUID NOT NULL REFERENCES programming_handover_modules(id) ON DELETE CASCADE,
    sort_order                  INTEGER NOT NULL DEFAULT 0,
    item_code                   VARCHAR(100),
    task_name                   VARCHAR(500) NOT NULL,
    description                 TEXT,
    device_name                 VARCHAR(255),
    device_ip                   VARCHAR(100),
    configuration_notes         TEXT,
    is_programmed               BOOLEAN DEFAULT FALSE,
    is_tested                   BOOLEAN DEFAULT FALSE,
    test_result                 VARCHAR(100),
    status                      item_status NOT NULL DEFAULT 'pending',
    technician_notes            TEXT,
    completed_by                UUID REFERENCES users(id),
    completed_at                TIMESTAMPTZ,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prog_handover_items_module ON programming_handover_items(programming_handover_module_id);

-- ============================================================
-- HANDOVER / REQUIRED FILES MODULE
-- ============================================================

CREATE TABLE handover_modules (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title           VARCHAR(500) NOT NULL DEFAULT 'Handover',
    description     TEXT,
    handover_date   DATE,
    client_rep_name VARCHAR(255),
    client_rep_sign_url VARCHAR(1000),
    tech_rep_name   VARCHAR(255),
    tech_rep_sign_url   VARCHAR(1000),
    is_completed    BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at    TIMESTAMPTZ,
    completed_by    UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_handover_modules_project ON handover_modules(project_id);

CREATE TABLE handover_required_files (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    handover_module_id  UUID NOT NULL REFERENCES handover_modules(id) ON DELETE CASCADE,
    sort_order          INTEGER NOT NULL DEFAULT 0,
    file_name           VARCHAR(500) NOT NULL,
    description         TEXT,
    is_required         BOOLEAN NOT NULL DEFAULT TRUE,
    is_uploaded         BOOLEAN NOT NULL DEFAULT FALSE,
    file_url            VARCHAR(1000),
    uploaded_by         UUID REFERENCES users(id),
    uploaded_at         TIMESTAMPTZ,
    expiry_date         DATE,
    status              item_status NOT NULL DEFAULT 'pending',
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_handover_files_module ON handover_required_files(handover_module_id);

-- ============================================================
-- REFRESH TOKENS (for JWT auth)
-- ============================================================

CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(500) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked     BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

-- ============================================================
-- updated_at auto-update trigger
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all relevant tables
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'clients', 'users', 'projects',
        'survey_modules', 'survey_items',
        'maintenance_modules', 'maintenance_items',
        'installation_modules', 'installation_items',
        'programming_handover_modules', 'programming_handover_items',
        'handover_modules', 'handover_required_files'
    ] LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_%s_updated_at
             BEFORE UPDATE ON %s
             FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
            t, t
        );
    END LOOP;
END;
$$;

-- ============================================================
-- SEED: default admin user
-- password: Admin@1234  (bcrypt)
-- ============================================================

INSERT INTO users (email, password_hash, full_name, role) VALUES
(
    'admin@projectmt.com',
    '$2b$12$ON0pOxMK1Wd3HmMj5mSJU.AlG7jfQ2bggpBr7KZFdOyfTqOwWhRgS',
    'System Administrator',
    'admin'
);
