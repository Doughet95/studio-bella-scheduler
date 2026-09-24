import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Inicializa a IA com a chave que o usuário colocou no Vercel
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Chave da API do Gemini não configurada' }, { status: 500 });
    }

    const formData = await req.json();

    // Busca o catálogo de exercícios no banco para a IA saber o que pode usar
    const { data: exercises } = await supabase.from('exercises').select('id, name, target_muscle');
    
    if (!exercises) {
      return NextResponse.json({ error: 'Erro ao carregar catálogo de exercícios' }, { status: 500 });
    }

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
    - Dias por semana: ${formData.diasPorSemana}
    - Tempo por treino: ${formData.tempoPorTreino} minutos
    - Lesões/Restrições: ${formData.lesoes || 'Nenhuma'}
    - Observações: ${formData.observacoes || 'Nenhuma'}

    CATÁLOGO DE EXERCÍCIOS DISPONÍVEIS:
    ${catalogString}

    Regras:
    1. Escolha APENAS exercícios do catálogo acima. Use o ID exato fornecido.
    2. Crie uma divisão de treino lógica e retorne 1 Ficha Principal.
    
    EXEMPLO DO ÚNICO FORMATO DE SAÍDA PERMITIDO:
    {
      "workout_name": "Treino A - Peito e Tríceps",
      "days_of_week": ["Segunda", "Quarta", "Sexta"],
      "exercises": [
        {
          "exercise_id": "UUID-AQUI",
          "default_sets": 3,
          "default_reps": "10-12"
        }
      ]
    }`;

    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) throw new Error("API Key não configurada");

    // Vamos buscar QUAIS modelos essa chave tem acesso diretamente na fonte
    let modelsToTry = [
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-3.0-flash',
      'gemini-1.5-flash',
      'gemini-pro'
    ];

    try {
      const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const modelsData = await modelsRes.json();
      if (modelsData && modelsData.models) {
        const available = modelsData.models
          .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
          .map((m: any) => m.name.replace('models/', ''));
        
        if (available.length > 0) {
          // Coloca os modelos disponíveis no início da fila de tentativas
          modelsToTry = [...available, ...modelsToTry];
        }
      }
    } catch (e) {
      console.warn("Não foi possível listar os modelos, usando a lista padrão.");
    }

    // Remove duplicatas
    modelsToTry = [...new Set(modelsToTry)];

    let responseText = '';
    let lastError = '';

    for (const modelName of modelsToTry) {
      try {
        console.log(`Tentando modelo: ${modelName}...`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            contents: [{ parts: [{ text: prompt }] }],
            // generationConfig: { responseMimeType: "application/json" } // Alguns modelos falham com isso se não suportarem, melhor focar no prompt
          })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          lastError = data.error?.message || JSON.stringify(data);
          console.warn(`Falha no modelo ${modelName}:`, lastError);
          continue; // Tenta o próximo modelo!
        }

        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
          responseText = data.candidates[0].content.parts[0].text;
          console.log(`Sucesso com o modelo: ${modelName}!`);
          break; // Sucesso absoluto, sai do loop
        }
      } catch (e: any) {
        lastError = e.message;
        console.warn(`Erro de rede no modelo ${modelName}:`, e.message);
      }
    }

    if (!responseText) {
      throw new Error(`Todos os modelos falharam. Último erro: ${lastError}`);
    }
    
    // Tenta encontrar um bloco JSON dentro da resposta (mesmo que a IA envie texto junto)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('A IA não retornou um formato JSON válido. Resposta: ' + responseText.substring(0, 100));
    }
    
    const cleanJson = jsonMatch[0];
    const workoutPlan = JSON.parse(cleanJson);

    return NextResponse.json(workoutPlan);
    
  } catch (error: any) {
    console.error('Erro ao gerar treino:', error);
    return NextResponse.json({ error: error.message || 'Falha ao processar com a IA' }, { status: 500 });
  }
}
