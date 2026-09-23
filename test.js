const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://revznnwmrrwdlbpdjfpr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJldnpubndtcnJ3ZGxicGRqZnByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMDI3NTIsImV4cCI6MjEwNTc3ODc1Mn0.k3eXzGYvIk9coVu0FTvV1G2BDvcSqxUqgidiZWBRaIc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('goals').insert([
    { name: 'Hipertrofia' },
    { name: 'Ganho de Força' },
    { name: 'Perda de Gordura' },
    { name: 'Resistência' }
  ]).select('*');
  
  console.log("Insert Data:", data);
  console.log("Insert Error:", error);
  
  const { data: exData, error: exError } = await supabase.from('exercises').insert([
    { name: 'Supino Reto com Barra', target_muscle: 'Peito' },
    { name: 'Agachamento Livre', target_muscle: 'Pernas' },
    { name: 'Levantamento Terra', target_muscle: 'Costas/Pernas' },
    { name: 'Puxada Frontal', target_muscle: 'Costas' },
    { name: 'Desenvolvimento com Halteres', target_muscle: 'Ombros' },
    { name: 'Rosca Direta', target_muscle: 'Bíceps' },
    { name: 'Tríceps Pulley', target_muscle: 'Tríceps' },
    { name: 'Leg Press', target_muscle: 'Pernas' }
  ]).select('*');
  
  console.log("Ex Data:", exData);
  console.log("Ex Error:", exError);
}

test();
