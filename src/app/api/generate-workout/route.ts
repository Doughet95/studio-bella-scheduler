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

    const prompt = `Você é um Personal Trainer de elite. Crie um treino ideal para este aluno:
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
    1. Escolha APENAS exercícios que estejam na lista do Catálogo acima. Use o ID exato fornecido.
    2. Crie uma divisão de treino lógica (ex: AB, ABC, ABCD dependendo dos dias na semana).
    3. Monte a ficha para a rotina diária do aluno. Como o aplicativo dele funciona com "fichas de treino", você deve retornar apenas UMA ficha (por exemplo, "Treino A - Peito e Tríceps", ou "Treino Full Body"), mas que seja a principal, ou se ele for treinar 3x na semana e o treino for A,B,C, escolha a FICHA A para ele começar.
    Wait, na verdade, para a estrutura do app, precisamos criar 1 Ficha Principal. Para simplificar, crie apenas 1 treino (ex: "Treino Adaptação - Full Body" ou "Treino A - Peito e Costas") que tenha entre 5 e 8 exercícios.

    RETORNE APENAS UM JSON VÁLIDO no seguinte formato, sem nenhum outro texto, markdown ou explicações:
    {
      "workout_name": "Nome sugerido para o treino (ex: Treino de Força A)",
      "days_of_week": ["Segunda", "Quarta", "Sexta"], // sugira dias ideais baseados na quantidade
      "exercises": [
        {
          "exercise_id": "UUID-do-exercicio",
          "default_sets": 3,
          "default_reps": "10-12"
        }
      ]
    }
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
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
