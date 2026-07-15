'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { Clock, Plus, Trash2, Save, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const DAYS_OF_WEEK = [
  { id: 1, name: 'Segunda-feira' },
  { id: 2, name: 'Terça-feira' },
  { id: 3, name: 'Quarta-feira' },
  { id: 4, name: 'Quinta-feira' },
  { id: 5, name: 'Sexta-feira' },
  { id: 6, name: 'Sábado' },
  { id: 0, name: 'Domingo' },
]

export function ScheduleSettings() {
  const [schedule, setSchedule] = useState<Record<number, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newTime, setNewTime] = useState<Record<number, string>>({})

  useEffect(() => {
    fetch('/api/settings/schedule')
      .then(res => res.json())
      .then(data => {
        setSchedule(data.data || {})
        setLoading(false)
      })
      .catch(() => {
        toast({ variant: 'destructive', title: 'Erro ao carregar horários' })
        setLoading(false)
      })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedule)
      })
      if (!res.ok) throw new Error('Falha ao salvar')
      toast({ title: 'Configurações salvas com sucesso!' })
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro ao salvar configurações' })
    } finally {
      setSaving(false)
    }
  }

  const toggleDay = (dayId: number) => {
    setSchedule(prev => {
      const current = prev[dayId] || []
      // Se estava habilitado (tinha array), desabilita (array vazio) e vice-versa
      // Mas para manter simples, se for vazio, adiciona horários padrão ou mantém vazio.
      // O usuário pode querer ligar/desligar apenas. Se desligar, limpa o array.
      if (current.length > 0) {
        return { ...prev, [dayId]: [] }
      } else {
        return { ...prev, [dayId]: ['08:00', '10:00'] } // Padrão ao ativar
      }
    })
  }

  const removeTime = (dayId: number, timeToRemove: string) => {
    setSchedule(prev => ({
      ...prev,
      [dayId]: prev[dayId].filter(t => t !== timeToRemove)
    }))
  }

  const addTime = (dayId: number) => {
    const time = newTime[dayId]
    if (!time) return

    setSchedule(prev => {
      const dayTimes = prev[dayId] || []
      if (dayTimes.includes(time)) return prev // Já existe
      
      const updated = [...dayTimes, time].sort() // Mantém em ordem cronológica
      return { ...prev, [dayId]: updated }
    })
    
    setNewTime(prev => ({ ...prev, [dayId]: '' })) // Limpa input
  }

  if (loading) {
    return <div className="flex h-40 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  return (
    <Card className="glass border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Dias e Horários de Atendimento
        </CardTitle>
        <CardDescription>
          Configure quais dias da semana você trabalhará e quais os horários disponíveis em cada um.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="space-y-4">
          {DAYS_OF_WEEK.map(day => {
            const isActive = schedule[day.id] && schedule[day.id].length > 0
            const times = schedule[day.id] || []

            return (
              <div key={day.id} className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 rounded-xl bg-card border border-border/50">
                
                {/* Day Toggle */}
                <div className="w-40 flex items-center gap-3">
                  <button
                    onClick={() => toggleDay(day.id)}
                    className={cn(
                      "w-10 h-5 rounded-full relative transition-colors duration-200 ease-in-out focus:outline-none",
                      isActive ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <span className={cn(
                      "absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out",
                      isActive ? "translate-x-5" : "translate-x-0"
                    )} />
                  </button>
                  <span className={cn("font-medium text-sm", isActive ? "text-foreground" : "text-muted-foreground")}>
                    {day.name}
                  </span>
                </div>

                {/* Times List & Add */}
                {isActive ? (
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {times.map(time => (
                        <div key={time} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                          {time}
                          <button onClick={() => removeTime(day.id, time)} className="hover:text-destructive transition-colors ml-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      
                      {/* Add new time inline */}
                      <div className="flex items-center gap-1">
                        <input
                          type="time"
                          value={newTime[day.id] || ''}
                          onChange={(e) => setNewTime({ ...newTime, [day.id]: e.target.value })}
                          className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => addTime(day.id)} disabled={!newTime[day.id]}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 text-sm text-muted-foreground flex items-center">
                    Fechado
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="pt-6 border-t border-border/50 flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar Configurações
          </Button>
        </div>

      </CardContent>
    </Card>
  )
}
