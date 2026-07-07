-- ============================================================
-- Studio Bella — Dados de Seed (Desenvolvimento)
-- Migration: 003_seed_data.sql
-- ============================================================

-- Serviços iniciais
INSERT INTO services (name, description, category, duration_minutes, price, sort_order) VALUES
  ('Design de Sobrancelhas',     'Modelagem completa com henna ou pigmento, fio a fio.',    'sobrancelha', 60,  80.00,  1),
  ('Laminação de Sobrancelhas',  'Técnica de alisamento e fixação dos fios por até 6 semanas.', 'sobrancelha', 90, 150.00, 2),
  ('Extensão de Cílios (Classic)', 'Aplicação fio a fio para um olhar natural e definido.',  'cilios',       120, 200.00, 3),
  ('Extensão de Cílios (Volume)', 'Técnica russa para volume máximo e dramático.',           'cilios',       150, 280.00, 4),
  ('Manutenção de Cílios',       'Reposição dos fios caídos. Recomendada a cada 3 semanas.',  'cilios',       90,  130.00, 5),
  ('Combo Sobrancelha + Cílios', 'Design de sobrancelhas + extensão classic em uma sessão.', 'combo',        180, 260.00, 6);

-- Disponibilidade padrão (segunda a sábado, 9h–18h)
-- (Será associada ao primeiro professional criado via trigger de auth)
