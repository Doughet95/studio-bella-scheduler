-- ============================================================
-- Studio Bella — Row Level Security Policies
-- Migration: 002_rls_policies.sql
-- ============================================================

-- ============================================================
-- PROFILES
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado vê seu próprio perfil
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Admins veem todos os perfis
CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

-- Usuário pode atualizar seu próprio perfil
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admin pode atualizar qualquer perfil
CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

-- ============================================================
-- SERVICES (públicos para leitura)
-- ============================================================
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode ver serviços ativos
CREATE POLICY "services_select_active"
  ON services FOR SELECT
  USING (active = TRUE);

-- Admin pode ver todos
CREATE POLICY "services_select_admin"
  ON services FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'professional')
  ));

-- Apenas admin gerencia serviços
CREATE POLICY "services_write_admin"
  ON services FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

-- ============================================================
-- CLIENTS
-- ============================================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Cliente vê seu próprio registro
CREATE POLICY "clients_select_own"
  ON clients FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- Admin/profissional vê todos os clientes
CREATE POLICY "clients_select_professional"
  ON clients FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'professional')
  ));

-- Admin/profissional pode criar/atualizar clientes
CREATE POLICY "clients_write_professional"
  ON clients FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'professional')
  ));

-- Permitir inserção anônima (agendamento sem conta)
CREATE POLICY "clients_insert_anon"
  ON clients FOR INSERT
  WITH CHECK (profile_id IS NULL);

-- ============================================================
-- APPOINTMENTS
-- ============================================================
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Cliente vê seus próprios agendamentos
CREATE POLICY "appointments_select_client"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE profile_id = auth.uid()
    )
  );

-- Admin/profissional vê todos
CREATE POLICY "appointments_select_professional"
  ON appointments FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'professional')
  ));

-- Admin/profissional pode criar/editar/deletar
CREATE POLICY "appointments_write_professional"
  ON appointments FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'professional')
  ));

-- Anônimos podem criar agendamentos (booking sem conta)
CREATE POLICY "appointments_insert_anon"
  ON appointments FOR INSERT
  WITH CHECK (TRUE);

-- ============================================================
-- AVAILABILITY (pública para leitura)
-- ============================================================
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "availability_select_all"
  ON availability FOR SELECT
  USING (active = TRUE);

CREATE POLICY "availability_write_admin"
  ON availability FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'professional')
  ));

-- ============================================================
-- BLOCKED_TIMES (pública para leitura — necessário para booking)
-- ============================================================
ALTER TABLE blocked_times ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blocked_times_select_all"
  ON blocked_times FOR SELECT
  USING (TRUE);

CREATE POLICY "blocked_times_write_admin"
  ON blocked_times FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'professional')
  ));

-- ============================================================
-- PAYMENTS
-- ============================================================
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select_professional"
  ON payments FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'professional')
  ));

CREATE POLICY "payments_write_professional"
  ON payments FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'professional')
  ));

-- ============================================================
-- NOTIFICATIONS (somente admin)
-- ============================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_admin"
  ON notifications FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

-- ============================================================
-- PROFESSIONALS (público para leitura dos ativos)
-- ============================================================
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "professionals_select_active"
  ON professionals FOR SELECT
  USING (active = TRUE);

CREATE POLICY "professionals_write_admin"
  ON professionals FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));
