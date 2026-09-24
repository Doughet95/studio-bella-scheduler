"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { useParams, useRouter } from "next/navigation"
import { Loader2, Save, Trash2 } from "lucide-react"

type Exercise = { id: string, name: string, target_muscle: string }

export default function EditWorkoutPage() {
  const { id } = useParams()
  const [name, setName] = useState("")
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedExercises, setSelectedExercises] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Custom exercise states
  const [customName, setCustomName] = useState("")
  const [customMuscle, setCustomMuscle] = useState("")
  const [creatingCustom, setCreatingCustom] = useState(false)
  const [selectedFromList, setSelectedFromList] = useState("")
  
  // Workout states
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  
  const router = useRouter()

  const handleCreateCustomExercise = async () => {
    if (!customName) return
    setCreatingCustom(true)
    
    const targetMuscle = customMuscle.trim() || "Geral"
    
    const { data, error } = await supabase.from('exercises').insert([
      { name: customName, target_muscle: targetMuscle }
    ]).select().single()
    
    if (data && !error) {
      setExercises(prev => [...prev, data])
      addExercise(data.id)
      setCustomName("")
      setCustomMuscle("")
    } else {
      alert("Erro ao criar exercício customizado.")
    }
    setCreatingCustom(false)
  }

  useEffect(() => {
    async function loadData() {
      // Carregar catálogo de exercícios
      const { data: exData } = await supabase.from('exercises').select('*').order('name')
      if (exData) setExercises(exData)
      
      // Carregar os dados da ficha
      const { data: wData } = await supabase.from('workouts').select('*').eq('id', id).single()
      if (wData) {
        setName(wData.name)
        if (wData.days_of_week) setSelectedDays(wData.days_of_week)
      }
      
      // Carregar os exercícios da ficha
      const { data: wExData } = await supabase.from('workout_exercises').select('*').eq('workout_id', id).order('order_index')
      if (wExData) {
        setSelectedExercises(wExData.map(e => ({
          exercise_id: e.exercise_id,
          default_sets: e.default_sets,
          default_reps: e.default_reps,
          is_superset: e.is_superset || false
        })))
      }
      
      setLoading(false)
    }
    loadData()
  }, [id])

  const addExercise = (exerciseId: string) => {
    if (!exerciseId) return
    setSelectedExercises(prev => [
      ...prev,
      { exercise_id: exerciseId, default_sets: 3, default_reps: "10-12", is_superset: false }
    ])
  }

  const removeExercise = (index: number) => {
    setSelectedExercises(prev => prev.filter((_, i) => i !== index))
  }

  const updateExerciseConfig = (index: number, field: string, value: any) => {
    setSelectedExercises(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || selectedExercises.length === 0) return
    setSaving(true)

    // 1. Atualizar a ficha de treino
    const { error: workoutError } = await supabase
      .from('workouts')
      .update({ 
        name,
        days_of_week: selectedDays.length > 0 ? `{${selectedDays.join(',')}}` : null
      })
      .eq('id', id)

    if (workoutError) {
      alert("Erro ao atualizar treino.")
      setSaving(false)
      return
    }

    // Limpar os exercícios antigos
    await supabase.from('workout_exercises').delete().eq('workout_id', id)

    // 2. Inserir os novos
    const exercisesToInsert = selectedExercises.map((ex: any, index) => ({
      workout_id: id,
      exercise_id: ex.exercise_id,
      default_sets: ex.default_sets,
      default_reps: ex.default_reps,
      order_index: index,
      is_superset: ex.is_superset || false
    }))

    const { error: exercisesError } = await supabase
      .from('workout_exercises')
      .insert(exercisesToInsert)

    if (exercisesError) {
      alert("Erro ao salvar exercícios.")
      setSaving(false)
      return
    }

    router.push('/dashboard')
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Editar Ficha</h1>
        <p className="text-muted-foreground mt-1">Altere o nome, os dias ou os exercícios da ficha.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="bg-card/40 border-border/50">
          <CardHeader>
            <CardTitle>Nome do Treino</CardTitle>
            <CardDescription>Ex: Treino A - Peito e Tríceps</CardDescription>
          </CardHeader>
          <CardContent>
            <Input 
              placeholder="Digite o nome da ficha..." 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required
              className="h-12 text-lg"
            />
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/50">
          <CardHeader>
            <CardTitle>Exercícios</CardTitle>
            <CardDescription>Adicione os exercícios que farão parte deste treino.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Seletor de Dias da Semana */}
            <div className="mb-6 space-y-3">
              <Label>Dias da Semana (Opcional)</Label>
              <div className="flex flex-wrap gap-2">
                {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(day => (
                  <Button
                    key={day}
                    type="button"
                    variant={selectedDays.includes(day) ? "default" : "outline"}
                    className="h-9"
                    onClick={() => {
                      setSelectedDays(prev => 
                        prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
                      )
                    }}
                  >
                    {day.substring(0, 3)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Seletor de Exercícios e Criação Personalizada */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 rounded-lg bg-card/60 border border-border/50">
              <div className="flex-1 space-y-2">
                <Label>Buscar exercício salvo</Label>
                <div className="flex gap-2">
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    onChange={(e) => setSelectedFromList(e.target.value)}
                    value={selectedFromList}
                  >
                    <option value="" disabled>Selecione da lista...</option>
                    {Array.from(new Map(exercises.map(e => [e.name, e])).values()).map(ex => (
                      <option key={ex.id} value={ex.id}>{ex.name} ({ex.target_muscle})</option>
                    ))}
                  </select>
                  <Button 
                    type="button" 
                    onClick={() => {
                      addExercise(selectedFromList)
                      setSelectedFromList("")
                    }}
                    disabled={!selectedFromList}
                  >
                    Adicionar
                  </Button>
                </div>
              </div>

              <div className="hidden md:flex items-center text-muted-foreground font-medium text-sm">OU</div>

              <div className="flex-1 space-y-2">
                <Label>Criar um novo exercício</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input 
                    placeholder="Nome (ex: Rosca Martelo)" 
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                  />
                  <Input 
                    placeholder="Músculo" 
                    className="sm:w-32"
                    value={customMuscle}
                    onChange={e => setCustomMuscle(e.target.value)}
                  />
                  <Button type="button" variant="secondary" onClick={handleCreateCustomExercise} disabled={!customName || creatingCustom}>
                    {creatingCustom ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar e Adicionar"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Lista de Selecionados */}
            <div className="space-y-3 mt-4">
              {selectedExercises.map((item, index) => {
                const ex = exercises.find(e => e.id === item.exercise_id)
                // Usaremos index > 0 para verificar se tem como fazer bi-set
                const isSuperset = (item as any).is_superset;
                
                return (
                  <div key={index} className="flex items-start gap-2">
                    {/* Linha indicadora de Bi-set */}
                    {isSuperset && (
                      <div className="w-1 h-full min-h-[4rem] bg-primary rounded-full mt-2" title="Bi-set com o anterior"></div>
                    )}
                    
                    <div className={`flex-1 flex flex-col sm:flex-row gap-3 items-center p-3 rounded-lg border ${isSuperset ? 'border-primary/50 bg-primary/5' : 'border-border/50 bg-background/50'}`}>
                      <div className="flex-1 font-medium">{ex?.name}</div>
                      
                      <div className="flex items-center gap-2">
                        <div className="w-16 sm:w-20">
                          <Label className="text-xs text-muted-foreground mb-1 block">Séries</Label>
                          <Input 
                            type="number" 
                            min="1" 
                            value={item.default_sets} 
                            onChange={e => updateExerciseConfig(index, 'default_sets', parseInt(e.target.value))}
                            className="h-8 px-2"
                          />
                        </div>
                        <div className="w-20 sm:w-24">
                          <Label className="text-xs text-muted-foreground mb-1 block">Reps</Label>
                          <Input 
                            value={item.default_reps} 
                            onChange={e => updateExerciseConfig(index, 'default_reps', e.target.value)}
                            className="h-8 px-2"
                            placeholder="Ex: 10-12"
                          />
                        </div>
                        <div className="pt-5 flex gap-1">
                          {index > 0 && (
                            <Button 
                              type="button" 
                              variant={isSuperset ? "default" : "outline"}
                              size="sm" 
                              className={`h-8 text-xs px-2 ${isSuperset ? '' : 'text-muted-foreground'}`}
                              onClick={() => updateExerciseConfig(index, 'is_superset' as any, !isSuperset)}
                              title="Agrupar com o exercício de cima (Bi-set)"
                            >
                              Bi-set
                            </Button>
                          )}
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => removeExercise(index)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {selectedExercises.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
                  Nenhum exercício adicionado ainda.
                </div>
              )}
            </div>

          </CardContent>
        </Card>

        <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={saving || !name || selectedExercises.length === 0}>
          {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
          Salvar Alterações
        </Button>
      </form>
    </div>
  )
}
