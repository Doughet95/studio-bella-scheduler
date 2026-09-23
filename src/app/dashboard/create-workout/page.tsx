"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Trash2 } from "lucide-react"

type Exercise = { id: string, name: string, target_muscle: string }

export default function CreateWorkoutPage() {
  const [name, setName] = useState("")
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedExercises, setSelectedExercises] = useState<{ exercise_id: string, default_sets: number, default_reps: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    supabase.from('exercises').select('*').order('name').then(({ data }) => {
      if (data) setExercises(data)
      setLoading(false)
    })
  }, [])

  const addExercise = (exerciseId: string) => {
    if (!exerciseId) return
    setSelectedExercises(prev => [
      ...prev,
      { exercise_id: exerciseId, default_sets: 3, default_reps: "10-12" }
    ])
  }

  const removeExercise = (index: number) => {
    setSelectedExercises(prev => prev.filter((_, i) => i !== index))
  }

  const updateExerciseConfig = (index: number, field: 'default_sets' | 'default_reps', value: any) => {
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

    // 1. Criar a ficha de treino
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .insert([{ name }])
      .select()
      .single()

    if (workoutError || !workout) {
      alert("Erro ao criar treino.")
      setSaving(false)
      return
    }

    // 2. Vincular os exercícios à ficha
    const exercisesToInsert = selectedExercises.map((ex, index) => ({
      workout_id: workout.id,
      exercise_id: ex.exercise_id,
      default_sets: ex.default_sets,
      default_reps: ex.default_reps,
      order_index: index
    }))

    const { error: exercisesError } = await supabase
      .from('workout_exercises')
      .insert(exercisesToInsert)

    if (exercisesError) {
      alert("Erro ao vincular exercícios.")
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
        <h1 className="text-3xl font-bold tracking-tight">Criar Nova Ficha</h1>
        <p className="text-muted-foreground mt-1">Monte seu treino selecionando os exercícios.</p>
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
            
            {/* Seletor Simples */}
            <div className="flex gap-2">
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                onChange={(e) => {
                  addExercise(e.target.value)
                  e.target.value = "" // reset
                }}
                defaultValue=""
              >
                <option value="" disabled>+ Adicionar Exercício</option>
                {exercises.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.name} ({ex.target_muscle})</option>
                ))}
              </select>
            </div>

            {/* Lista de Selecionados */}
            <div className="space-y-3 mt-4">
              {selectedExercises.map((item, index) => {
                const ex = exercises.find(e => e.id === item.exercise_id)
                return (
                  <div key={index} className="flex flex-col sm:flex-row gap-3 items-center p-3 rounded-lg border border-border/50 bg-background/50">
                    <div className="flex-1 font-medium">{ex?.name}</div>
                    
                    <div className="flex items-center gap-2">
                      <div className="w-20">
                        <Label className="text-xs text-muted-foreground mb-1 block">Séries</Label>
                        <Input 
                          type="number" 
                          min="1" 
                          value={item.default_sets} 
                          onChange={e => updateExerciseConfig(index, 'default_sets', parseInt(e.target.value))}
                          className="h-8"
                        />
                      </div>
                      <div className="w-24">
                        <Label className="text-xs text-muted-foreground mb-1 block">Reps</Label>
                        <Input 
                          value={item.default_reps} 
                          onChange={e => updateExerciseConfig(index, 'default_reps', e.target.value)}
                          className="h-8"
                          placeholder="Ex: 10-12"
                        />
                      </div>
                      <div className="pt-5">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => removeExercise(index)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
          {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
          Salvar Ficha de Treino
        </Button>
      </form>
    </div>
  )
}
