"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Sparkles, ArrowRight, ArrowLeft, Loader2, Dumbbell, Activity, Calendar, HeartPulse } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"

import { supabase } from "@/lib/supabase"

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    idade: "",
    peso: "",
    altura: "",
    genero: "",
    objetivos: [] as string[],
    experiencia: "",
    diasPorSemana: "",
    tempoPorTreino: "",
    lesoes: "",
    observacoes: "",
    medidas_braco: "",
    medidas_peito: "",
    medidas_cintura: "",
    medidas_coxa: "",
    medidas_quadril: "",
    medidas_bumbum: "",
    dieta_refeicoes: "",
    dieta_doces_frituras: "",
    dieta_agua: ""
  })

  const handleNext = () => setStep(s => s + 1)
  const handlePrev = () => setStep(s => s - 1)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Você precisa estar logado para criar treinos.");
        setLoading(false);
        router.push('/');
        return;
      }

      // 1. Chamar a IA
      const res = await fetch('/api/generate-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const plan = await res.json()
      
      if (plan.error) {
        alert("Erro na IA: " + plan.error)
        setLoading(false)
        return
      }

      // 2. Salvar Fichas no Supabase (o plano agora é um Array de fichas)
      const workoutsArray = Array.isArray(plan) ? plan : [plan];

      for (const w of workoutsArray) {
        const { data: workout, error: workoutError } = await supabase
          .from('workouts')
          .insert([{ 
            name: w.workout_name || "Treino IA",
            days_of_week: w.days_of_week && w.days_of_week.length > 0 ? `{${w.days_of_week.join(',')}}` : null,
            user_id: session.user.id
          }])
          .select()
          .single()

        if (!workoutError && workout && w.exercises) {
          // 3. Vincular exercícios daquela ficha
          const exercisesToInsert = w.exercises.map((ex: any, idx: number) => ({
            workout_id: workout.id,
            exercise_id: ex.exercise_id,
            default_sets: ex.default_sets || 3,
            default_reps: ex.default_reps || "10-12",
            order_index: idx,
            is_superset: false
          }))
          await supabase.from('workout_exercises').insert(exercisesToInsert)
        }
      }

      // 4. Redirecionar
      router.push('/dashboard')
    } catch (e) {
      console.error(e)
      alert("Falha ao gerar treino. Verifique a API Key do Gemini.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-xl w-full">
        
        {/* Progresso */}
        <div className="flex gap-2 mb-8 px-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className={`h-2 flex-1 rounded-full transition-colors ${step >= i ? 'bg-primary' : 'bg-primary/20'}`} />
          ))}
        </div>

        <Card className="bg-card/40 border-border/50 shadow-2xl backdrop-blur-xl">
          {/* PASSO 1: DADOS BÁSICOS */}
          {step === 1 && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <UserIcon />
                </div>
                <CardTitle className="text-2xl">Dados Pessoais</CardTitle>
                <CardDescription>Para a IA entender seu biotipo e calcular necessidades.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Idade</Label>
                    <Input type="number" placeholder="Ex: 25" value={formData.idade} onChange={e => setFormData({...formData, idade: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Gênero</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.genero}
                      onChange={e => setFormData({...formData, genero: e.target.value})}
                    >
                      <option value="" disabled>Selecione...</option>
                      <option value="masculino">Masculino</option>
                      <option value="feminino">Feminino</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Peso (kg)</Label>
                    <Input type="number" placeholder="Ex: 75.5" value={formData.peso} onChange={e => setFormData({...formData, peso: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Altura (cm)</Label>
                    <Input type="number" placeholder="Ex: 175" value={formData.altura} onChange={e => setFormData({...formData, altura: e.target.value})} />
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {/* PASSO 2: OBJETIVO E EXPERIÊNCIA */}
          {step === 2 && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <Dumbbell className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Objetivo Principal</CardTitle>
                <CardDescription>O que você deseja alcançar com os treinos? (Selecione um ou mais)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <div className="space-y-3">
                  <Label>Qual o seu foco?</Label>
                  <div className="space-y-2">
                    {[
                      { id: "hipertrofia", label: "Hipertrofia (Ganho de Massa)" },
                      { id: "emagrecimento", label: "Emagrecimento (Perda de Gordura)" },
                      { id: "forca", label: "Força Absoluta" },
                      { id: "resistencia", label: "Resistência e Condicionamento" }
                    ].map(obj => (
                      <label key={obj.id} className="flex items-center space-x-3 border p-3 rounded-lg border-border/50 cursor-pointer hover:bg-primary/5 transition-colors">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-primary bg-background border-primary/50 rounded focus:ring-primary"
                          checked={formData.objetivos.includes(obj.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, objetivos: [...formData.objetivos, obj.id] });
                            } else {
                              setFormData({ ...formData, objetivos: formData.objetivos.filter(o => o !== obj.id) });
                            }
                          }}
                        />
                        <span className="font-medium flex-1">{obj.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Qual o seu nível de experiência?</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={formData.experiencia}
                    onChange={e => setFormData({...formData, experiencia: e.target.value})}
                  >
                    <option value="" disabled>Selecione...</option>
                    <option value="iniciante">Iniciante (Nunca treinei ou treino há menos de 6 meses)</option>
                    <option value="intermediario">Intermediário (Treino de forma consistente há +6 meses)</option>
                    <option value="avancado">Avançado (Treino pesado há mais de 2 anos)</option>
                  </select>
                </div>
              </CardContent>
            </>
          )}

          {/* PASSO 3: MEDIDAS CORPORAIS */}
          {step === 3 && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <Activity className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Suas Medidas</CardTitle>
                <CardDescription>Para acompanharmos sua evolução detalhadamente (Opcional).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Braço (cm)</Label>
                    <Input type="number" placeholder="Ex: 35" value={formData.medidas_braco} onChange={e => setFormData({...formData, medidas_braco: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Peito/Busto (cm)</Label>
                    <Input type="number" placeholder="Ex: 100" value={formData.medidas_peito} onChange={e => setFormData({...formData, medidas_peito: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cintura (cm)</Label>
                    <Input type="number" placeholder="Ex: 80" value={formData.medidas_cintura} onChange={e => setFormData({...formData, medidas_cintura: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Quadril (cm)</Label>
                    <Input type="number" placeholder="Ex: 105" value={formData.medidas_quadril} onChange={e => setFormData({...formData, medidas_quadril: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Coxa (cm)</Label>
                    <Input type="number" placeholder="Ex: 60" value={formData.medidas_coxa} onChange={e => setFormData({...formData, medidas_coxa: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Bumbum (cm)</Label>
                    <Input type="number" placeholder="Ex: 110" value={formData.medidas_bumbum} onChange={e => setFormData({...formData, medidas_bumbum: e.target.value})} />
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {/* PASSO 4: DIETA E HÁBITOS */}
          {step === 4 && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <Activity className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Alimentação</CardTitle>
                <CardDescription>O que você come dita 70% dos seus resultados.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <div className="space-y-2">
                  <Label>Quantas refeições você faz por dia em média?</Label>
                  <Input type="number" placeholder="Ex: 4" value={formData.dieta_refeicoes} onChange={e => setFormData({...formData, dieta_refeicoes: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Quantos litros de água você bebe por dia?</Label>
                  <Input type="number" step="0.1" placeholder="Ex: 2.5" value={formData.dieta_agua} onChange={e => setFormData({...formData, dieta_agua: e.target.value})} />
                </div>
                <div className="space-y-3">
                  <Label>Consome muito doce, frituras ou açúcar?</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={formData.dieta_doces_frituras}
                    onChange={e => setFormData({...formData, dieta_doces_frituras: e.target.value})}
                  >
                    <option value="" disabled>Selecione...</option>
                    <option value="nunca">Quase nunca, sou bem focado(a)</option>
                    <option value="as_vezes">Às vezes (finais de semana)</option>
                    <option value="frequentemente">Frequentemente (quase todo dia)</option>
                  </select>
                </div>
              </CardContent>
            </>
          )}

          {/* PASSO 5: ROTINA */}
          {step === 5 && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Sua Rotina</CardTitle>
                <CardDescription>Para a IA distribuir o treino perfeitamente nos seus dias.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <div className="space-y-3">
                  <Label>Quantos dias por semana você vai treinar?</Label>
                  <div className="flex gap-2 flex-wrap">
                    {['1', '2', '3', '4', '5', '6', '7'].map(d => (
                      <Button 
                        key={d} 
                        type="button"
                        variant={formData.diasPorSemana === d ? 'default' : 'outline'}
                        onClick={() => setFormData({...formData, diasPorSemana: d})}
                        className="flex-1 h-12 text-lg"
                      >
                        {d}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Quanto tempo disponível por treino?</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={formData.tempoPorTreino}
                    onChange={e => setFormData({...formData, tempoPorTreino: e.target.value})}
                  >
                    <option value="" disabled>Selecione...</option>
                    <option value="30">Super Rápido (30 - 40 min)</option>
                    <option value="45">Normal (45 - 60 min)</option>
                    <option value="90">Longo (+60 min)</option>
                  </select>
                </div>
              </CardContent>
            </>
          )}

          {/* PASSO 6: SAÚDE E GERAR */}
          {step === 6 && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <HeartPulse className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Saúde & Preferências</CardTitle>
                <CardDescription>Quase lá! Detalhes para garantir a sua segurança.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <div className="space-y-2">
                  <Label>Possui alguma lesão ou recomendação médica?</Label>
                  <Textarea 
                    placeholder="Ex: Hérnia de disco lombar, dor no ombro esquerdo, joelho operado..." 
                    value={formData.lesoes}
                    onChange={e => setFormData({...formData, lesoes: e.target.value})}
                    className="min-h-[80px]"
                  />
                  <p className="text-xs text-muted-foreground">Deixe em branco se estiver 100% apto(a).</p>
                </div>
                <div className="space-y-2">
                  <Label>Há algum exercício que você detesta ou ama? (Opcional)</Label>
                  <Textarea 
                    placeholder="Ex: Não gosto de agachamento livre, adoro treinar costas..." 
                    value={formData.observacoes}
                    onChange={e => setFormData({...formData, observacoes: e.target.value})}
                    className="min-h-[80px]"
                  />
                </div>
              </CardContent>
            </>
          )}

          {/* NAVEGAÇÃO */}
          <div className="p-6 pt-2 flex justify-between gap-4">
            {step > 1 ? (
              <Button variant="outline" onClick={handlePrev} className="w-32">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
              </Button>
            ) : <div className="w-32"></div>}

            {step < 6 ? (
              <Button onClick={handleNext} className="flex-1 font-bold">
                Próximo <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleGenerate} className="flex-1 font-bold text-lg bg-gradient-to-r from-primary to-primary/80 hover:scale-105 transition-transform" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" />}
                Gerar Treino com IA
              </Button>
            )}
          </div>

        </Card>
      </div>
    </div>
  )
}

function UserIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  )
}
