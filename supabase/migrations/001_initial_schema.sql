-- ============================================================
-- Studio Bella — Schema Inicial
-- Migration: 001_initial_schema.sql
-- ============================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- para busca full-text

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'professional', 'client');
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
CREATE TYPE payment_method AS ENUM ('cash', 'credit_card', 'debit_card', 'pix', 'transfer');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded', 'cancelled');
CREATE TYPE notification_type AS ENUM ('confirmation', 'reminder_24h', 'reminder_2h', 'cancellation', 'custom');
CREATE TYPE service_category AS ENUM ('sobrancelha', 'cilios', 'combo', 'outros');
CREATE TYPE day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

-- ============================================================
-- TABELA: profiles (extensão de auth.users do Supabase)
-- ============================================================

CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  phone        TEXT,
  avatar_url   TEXT,
  role         user_role NOT NULL DEFAULT 'client',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: professionals
-- ============================================================

CREATE TABLE professionals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bio          TEXT,
  instagram    TEXT,
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id)
);

-- ============================================================
-- TABELA: services
-- ============================================================

CREATE TABLE services (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  description       TEXT,
  category          service_category NOT NULL DEFAULT 'outros',
  duration_minutes  INTEGER NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
  price             NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  active            BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: clients (pode existir sem conta)
-- ============================================================

CREATE TABLE clients (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   UUID REFERENCES profiles(id) ON DELETE SET NULL, -- opcional
  name         TEXT NOT NULL,
  email        TEXT,
  phone        TEXT,
  notes        TEXT,           -- notas gerais (rich text HTML do TipTap)
  tags         TEXT[],         -- ex: ['VIP', 'alergia']
  birth_date   DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para busca por nome/email/telefone
CREATE INDEX idx_clients_search ON clients USING gin (
  (name || ' ' || COALESCE(email, '') || ' ' || COALESCE(phone, '')) gin_trgm_ops
);

-- ============================================================
-- TABELA: appointments
-- ============================================================

CREATE TABLE appointments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  professional_id   UUID NOT NULL REFERENCES professionals(id) ON DELETE RESTRICT,
  service_id        UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  scheduled_at      TIMESTAMPTZ NOT NULL,
  duration_minutes  INTEGER NOT NULL CHECK (duration_minutes > 0),
  status            appointment_status NOT NULL DEFAULT 'pending',
  price             NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  notes             TEXT,
  internal_notes    TEXT,     -- notas internas do profissional
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_appointments_scheduled ON appointments (scheduled_at);
CREATE INDEX idx_appointments_professional ON appointments (professional_id, scheduled_at);
CREATE INDEX idx_appointments_client ON appointments (client_id);
CREATE INDEX idx_appointments_status ON appointments (status);

-- ============================================================
-- TABELA: availability (disponibilidade semanal)
-- ============================================================

CREATE TABLE availability (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id   UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  day_of_week       day_of_week NOT NULL,
  start_time        TIME NOT NULL,
  end_time          TIME NOT NULL,
  active            BOOLEAN NOT NULL DEFAULT TRUE,
  CHECK (end_time > start_time),
  UNIQUE(professional_id, day_of_week)
);

-- ============================================================
-- TABELA: blocked_times (bloqueios específicos de agenda)
-- ============================================================

CREATE TABLE blocked_times (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id   UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  start_at          TIMESTAMPTZ NOT NULL,
  end_at            TIMESTAMPTZ NOT NULL,
  reason            TEXT,
  CHECK (end_at > start_at)
);

CREATE INDEX idx_blocked_times_professional ON blocked_times (professional_id, start_at, end_at);

-- ============================================================
-- TABELA: payments
-- ============================================================

CREATE TABLE payments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id    UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  amount            NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  method            payment_method,
  status            payment_status NOT NULL DEFAULT 'pending',
  notes             TEXT,
  paid_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_payments_appointment ON payments (appointment_id);

-- ============================================================
-- TABELA: notifications
-- ============================================================

CREATE TABLE notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id    UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  type              notification_type NOT NULL,
  recipient_email   TEXT NOT NULL,
  sent_at           TIMESTAMPTZ,
  status            TEXT NOT NULL DEFAULT 'queued', -- queued | sent | failed
  error_message     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TRIGGERS: updated_at automático
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_services
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_clients
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_appointments
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TRIGGER: criar profile automaticamente ao registrar
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
