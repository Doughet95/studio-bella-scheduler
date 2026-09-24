export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const formData = await req.json();

    const { data: exercises } = await supabase.from('exercises').select('id, name, target_muscle');
    if (!exercises) return NextResponse.json({ error: 'Erro ao carregar catálogo' }, { status: 500 });

    const catalogString = exercises.map(e => `[ID: ${e.id}] ${e.name} (${e.target_muscle})`).join('\n');

    const prompt = `ATENÇÃO: VOCÊ DEVE RESPONDER EXCLUSIVAMENTE COM UM OBJETO JSON VÁLIDO.
    NÃO escreva nenhum texto adicional, nem antes nem depois do JSON. Não coloque crases (\`\`\`).
    Apenas o objeto JSON puro que represente a ficha de treino.

    Perfil do Aluno:
    - Idade: ${formData.idade}
    - Gênero: ${formData.genero}
    - Peso: ${formData.peso}kg, Altura: ${formData.altura}cm
    - Objetivo: ${formData.objetivo}
    - Nível: ${formData.experiencia}
    - Dias: ${formData.diasPorSemana}
    - Tempo: ${formData.tempoPorTreino} min
    - Lesões: ${formData.lesoes || 'Nenhuma'}
    - Obs: ${formData.observacoes || 'Nenhuma'}

    CATÁLOGO DE EXERCÍCIOS:
    ${catalogString}

    Regras:
    1. Escolha APENAS exercícios do catálogo acima. Use o ID exato fornecido.
    2. Crie uma divisão de treino lógica baseada nos dias por semana (ex: AB, ABC, ABCD). Para 5 dias, você pode fazer ABCAB, ou ABCDE.
    3. RETORNE UM ARRAY JSON contendo TODAS as fichas necessárias (ex: se for um treino ABC, o array deve ter 3 objetos).
    
    EXEMPLO DO ÚNICO FORMATO DE SAÍDA PERMITIDO (Array de Fichas):
    [
      {
        "workout_name": "Treino A - Peito e Tríceps",
        "days_of_week": ["Segunda", "Quinta"],
        "exercises": [ { "exercise_id": "UUID-AQUI", "default_sets": 3, "default_reps": "10-12" } ]
      },
      {
        "workout_name": "Treino B - Costas e Bíceps",
        "days_of_week": ["Terça", "Sexta"],
        "exercises": [ { "exercise_id": "UUID-AQUI", "default_sets": 4, "default_reps": "8-10" } ]
      }
    ]`;

    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) throw new Error("API Key não configurada");

    let modelsToTry = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.0-flash', 'gemini-1.5-flash', 'gemini-pro'];

    // RESTAURANDO A BUSCA DINÂMICA QUE FOI REMOVIDA SEM QUERER!
    try {
      const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const modelsData = await modelsRes.json();
      if (modelsData && modelsData.models) {
        const available = modelsData.models
          .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
          .map((m: any) => m.name.replace('models/', ''));
        
        if (available.length > 0) {
          modelsToTry = [...available, ...modelsToTry];
        }
      }
    } catch (e) {
      console.warn("Não foi possível listar os modelos, usando a lista padrão.");
    }

    modelsToTry = [...new Set(modelsToTry)];

    // Lança todos os modelos ao mesmo tempo (corrida) e o primeiro que responder sucesso ganha!
    const promises = modelsToTry.map(async (modelName) => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error?.message || "Erro na API");
        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
          return data.candidates[0].content.parts[0].text;
        }
        throw new Error("Sem resposta válida");
      } catch (e) {
        clearTimeout(timeoutId);
        throw e;
      }
    });

    let responseText = '';
    try {
      responseText = await Promise.any(promises);
    } catch (e: any) {
      const msgs = e.errors ? e.errors.map((err: any) => err.message).join(' | ') : e.message;
      throw new Error('Falha total. Erros: ' + msgs);
    }
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('A IA não retornou JSON válido.');
    
    const cleanJson = jsonMatch[0];
    const workoutPlan = JSON.parse(cleanJson);

    return NextResponse.json(workoutPlan);
    
  } catch (error: any) {
    console.error('Erro:', error);
    return NextResponse.json({ error: error.message || 'Falha ao processar' }, { status: 500 });
  }
}
