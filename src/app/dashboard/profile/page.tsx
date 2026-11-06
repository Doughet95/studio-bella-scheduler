"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Loader2,
  User,
  Scale,
  Ruler,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  Activity
} from "lucide-react"

export type BodyMeasurementEntry = {
  id: string
  date: string // ISO string or YYYY-MM-DD
  created_at: string
  weight: number | null
  body_fat?: number | null
  arm: number | null
  chest: number | null
  waist: number | null
  hips: number | null
  thigh: number | null
  calf: number | null
  glutes: number | null
  notes?: string
}

export type UserProfileData = {
  name: string
  height_cm: number | ""
  age: number | ""
  goal: string
}

const METRIC_FIELDS: {
  key: keyof Pick<
    BodyMeasurementEntry,
    "weight" | "arm" | "chest" | "waist" | "thigh" | "calf" | "hips" | "glutes" | "body_fat"
  >
  label: string
  unit: string
  placeholder: string
}[] = [
  { key: "weight", label: "Peso Corporal", unit: "kg", placeholder: "Ex: 78.5" },
  { key: "arm", label: "Braço / Bíceps", unit: "cm", placeholder: "Ex: 38" },
  { key: "chest", label: "Peito / Tórax", unit: "cm", placeholder: "Ex: 102" },
  { key: "waist", label: "Cintura / Abdômen", unit: "cm", placeholder: "Ex: 82" },
  { key: "thigh", label: "Coxa", unit: "cm", placeholder: "Ex: 60" },
  { key: "calf", label: "Panturrilha", unit: "cm", placeholder: "Ex: 39" },
  { key: "hips", label: "Quadril", unit: "cm", placeholder: "Ex: 98" },
  { key: "glutes", label: "Glúteo / Bumbum", unit: "cm", placeholder: "Ex: 104" },
  { key: "body_fat", label: "Gordura Corporal (Opcional)", unit: "%", placeholder: "Ex: 15" }
]

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [userId, setUserId] = useState<string>("")
  const [userEmail, setUserEmail] = useState<string>("")

  // Dados gerais do perfil
  const [profile, setProfile] = useState<UserProfileData>({
    name: "",
    height_cm: "",
    age: "",
    goal: "Hipertrofia (Ganho de Massa)"
  })

  // Histórico de medições (ordenado da mais recente para a mais antiga)
  const [history, setHistory] = useState<BodyMeasurementEntry[]>([])

  // Formulário para nova medição
  const todayStr = new Date().toISOString().split("T")[0]
  const [entryDate, setEntryDate] = useState<string>(todayStr)
  const [formMetrics, setFormMetrics] = useState<Record<string, string>>({
    weight: "",
    arm: "",
    chest: "",
    waist: "",
    thigh: "",
    calf: "",
    hips: "",
    glutes: "",
    body_fat: "",
    notes: ""
  })

  useEffect(() => {
    async function loadProfileData() {
      setLoading(true)
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/")
        return
      }

      setUserId(user.id)
      setUserEmail(user.email || "")

      const meta = user.user_metadata || {}
      let loadedProfile: UserProfileData = {
        name: meta.profile_name || "",
        height_cm: meta.height_cm ?? "",
        age: meta.age ?? "",
        goal: meta.goal || "Hipertrofia (Ganho de Massa)"
      }

      let loadedHistory: BodyMeasurementEntry[] = Array.isArray(meta.measurements_history)
        ? meta.measurements_history
        : []

      // Backup local caso tenha algo salvo no dispositivo
      if (typeof window !== "undefined") {
        try {
          const localRaw = localStorage.getItem(`gym_profile_data_${user.id}`)
          if (localRaw) {
            const parsed = JSON.parse(localRaw)
            if (
              Array.isArray(parsed.history) &&
              parsed.history.length > loadedHistory.length
            ) {
              loadedHistory = parsed.history
            }
            if (!loadedProfile.height_cm && parsed.profile?.height_cm) {
              loadedProfile = { ...loadedProfile, ...parsed.profile }
            }
          }
        } catch {}
      }

      // Ordena do mais recente para o mais antigo
      loadedHistory.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      setProfile(loadedProfile)
      setHistory(loadedHistory)

      // Pré-preenche os campos de medidas com os últimos valores registrados para facilitar atualização
      if (loadedHistory.length > 0) {
        const latest = loadedHistory[0]
        setFormMetrics({
          weight: latest.weight !== null && latest.weight !== undefined ? String(latest.weight) : "",
          arm: latest.arm !== null && latest.arm !== undefined ? String(latest.arm) : "",
          chest: latest.chest !== null && latest.chest !== undefined ? String(latest.chest) : "",
          waist: latest.waist !== null && latest.waist !== undefined ? String(latest.waist) : "",
          thigh: latest.thigh !== null && latest.thigh !== undefined ? String(latest.thigh) : "",
          calf: latest.calf !== null && latest.calf !== undefined ? String(latest.calf) : "",
          hips: latest.hips !== null && latest.hips !== undefined ? String(latest.hips) : "",
          glutes: latest.glutes !== null && latest.glutes !== undefined ? String(latest.glutes) : "",
          body_fat:
            latest.body_fat !== null && latest.body_fat !== undefined ? String(latest.body_fat) : "",
          notes: ""
        })
      }

      setLoading(false)
    }

    loadProfileData()
  }, [router])

  const persistProfileAndHistory = async (
    nextProfile: UserProfileData,
    nextHistory: BodyMeasurementEntry[]
  ) => {
    const sorted = [...nextHistory].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    if (typeof window !== "undefined" && userId) {
      try {
        localStorage.setItem(
          `gym_profile_data_${userId}`,
          JSON.stringify({ profile: nextProfile, history: sorted })
        )
      } catch {}
    }

    const { error } = await supabase.auth.updateUser({
      data: {
        profile_name: nextProfile.name,
        height_cm: nextProfile.height_cm,
        age: nextProfile.age,
        goal: nextProfile.goal,
        measurements_history: sorted
      }
    })

    if (error) {
      console.error("Erro ao sincronizar no Supabase Auth:", error)
    }

    setProfile(nextProfile)
    setHistory(sorted)
  }

  const handleSaveMeasurement = async (e: React.FormEvent) => {
    e.preventDefault()

    const parseNum = (val: string) => {
      if (!val || val.trim() === "") return null
      const normalized = Number(val.replace(",", "."))
      return isNaN(normalized) ? null : normalized
    }

    const newEntry: BodyMeasurementEntry = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      date: entryDate || todayStr,
      created_at: new Date().toISOString(),
      weight: parseNum(formMetrics.weight),
      arm: parseNum(formMetrics.arm),
      chest: parseNum(formMetrics.chest),
      waist: parseNum(formMetrics.waist),
      thigh: parseNum(formMetrics.thigh),
      calf: parseNum(formMetrics.calf),
      hips: parseNum(formMetrics.hips),
      glutes: parseNum(formMetrics.glutes),
      body_fat: parseNum(formMetrics.body_fat),
      notes: formMetrics.notes.trim()
    }

    const hasAnyValue = METRIC_FIELDS.some(f => newEntry[f.key] !== null)
    if (!hasAnyValue) {
      alert("Preencha pelo menos o seu peso ou uma medida para salvar no histórico.")
      return
    }

    setSaving(true)
    setSavedSuccess(false)

    const nextHistory = [newEntry, ...history]
    await persistProfileAndHistory(profile, nextHistory)

    setFormMetrics(prev => ({ ...prev, notes: "" }))
    setSaving(false)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 4000)
  }

  const handleSaveProfileOnly = async () => {
    setSaving(true)
    await persistProfileAndHistory(profile, history)
    setSaving(false)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3000)
  }

  const handleDeleteEntry = async (entryId: string, dateLabel: string) => {
    if (!confirm(`Deseja excluir o registro de medidas do dia ${dateLabel}?`)) return
    const nextHistory = history.filter(h => h.id !== entryId)
    await persistProfileAndHistory(profile, nextHistory)
  }

  const latestEntry = history[0] || null
  const previousEntry = history[1] || null
  const firstEntry = history.length > 1 ? history[history.length - 1] : null

  // Cálculo de IMC
  const currentWeight = latestEntry?.weight ?? null
  const heightMeters = profile.height_cm ? Number(profile.height_cm) / 100 : null
  const bmi =
    currentWeight && heightMeters && heightMeters > 0
      ? (currentWeight / (heightMeters * heightMeters)).toFixed(1)
      : null

  const formatDiffBadge = (currentVal: number | null | undefined, compareVal: number | null | undefined, unit: string, labelPrefix = "") => {
    if (currentVal === null || currentVal === undefined || compareVal === null || compareVal === undefined) {
      return null
    }
    const diff = Number((currentVal - compareVal).toFixed(1))
    if (diff === 0) {
      return (
        <span className="text-[11px] font-medium text-gray-400">
          {labelPrefix}= 0{unit}
        </span>
      )
    }
    const isPositive = diff > 0
    return (
      <span
        className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
          isPositive
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            : "bg-sky-500/20 text-sky-300 border border-sky-500/30"
        }`}
      >
        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {labelPrefix}
        {isPositive ? `+${diff}` : diff}
        {unit}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Meu Perfil & Medidas
            </h1>
            <p className="text-gray-300 text-sm mt-0.5">
              Atualize seu peso e medidas e acompanhe seu ganho de massa ao longo do tempo.
            </p>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 backdrop-blur-md flex items-center gap-3 text-emerald-200 shadow-lg">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
          <p className="font-bold text-white text-sm">
            Dados salvos com sucesso! Seu histórico de evolução foi atualizado. 💪
          </p>
        </div>
      )}

      {/* PAINEL DE RESUMO DE EVOLUÇÃO ATUAL */}
      {latestEntry && (
        <Card className="bg-card/30 backdrop-blur-xl border-primary/40 shadow-2xl overflow-hidden">
          <CardHeader className="pb-3 bg-white/5 border-b border-white/10">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/20 text-primary">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg text-white">Resumo da Sua Evolução Corporal</CardTitle>
                  <CardDescription className="text-xs text-gray-300">
                    Última atualização em{" "}
                    {new Date(latestEntry.date + "T12:00:00").toLocaleDateString("pt-BR")}
                    {firstEntry ? ` • Comparando com o início (${new Date(firstEntry.date + "T12:00:00").toLocaleDateString("pt-BR")})` : ""}
                  </CardDescription>
                </div>
              </div>
              {bmi && (
                <span className="text-xs font-bold bg-primary/20 border border-primary/40 text-white px-3 py-1 rounded-full">
                  IMC Atual: {bmi}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {METRIC_FIELDS.map(field => {
                const val = latestEntry[field.key]
                if (val === null || val === undefined) return null
                const firstVal = firstEntry ? firstEntry[field.key] : null
                const prevVal = previousEntry ? previousEntry[field.key] : null

                return (
                  <div
                    key={field.key}
                    className="p-3 rounded-xl bg-background/60 border border-white/10 flex flex-col justify-between gap-1.5"
                  >
                    <span className="text-xs text-gray-400 font-medium">{field.label}</span>
                    <div className="text-xl font-black text-white">
                      {val}{" "}
                      <span className="text-xs font-normal text-gray-400">{field.unit}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      {firstEntry && firstVal !== null && firstVal !== undefined
                        ? formatDiffBadge(val, firstVal, field.unit, "Total: ")
                        : prevVal !== null && prevVal !== undefined
                        ? formatDiffBadge(val, prevVal, field.unit, "")
                        : <span className="text-[11px] text-gray-500">1º registro</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* DADOS PESSOAIS DO PERFIL */}
      <Card className="bg-card/25 backdrop-blur-xl border-white/10 shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg text-white">Dados Pessoais</CardTitle>
          </div>
          <CardDescription className="text-gray-300 text-xs">
            Conta conectada: <strong className="text-white">{userEmail}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs text-gray-300">Seu Nome</Label>
              <Input
                placeholder="Ex: Douglas"
                value={profile.name}
                onChange={e => setProfile({ ...profile, name: e.target.value })}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-300">Altura (cm)</Label>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="Ex: 175"
                value={profile.height_cm}
                onChange={e =>
                  setProfile({
                    ...profile,
                    height_cm: e.target.value === "" ? "" : Number(e.target.value)
                  })
                }
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-300">Idade</Label>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="Ex: 28"
                value={profile.age}
                onChange={e =>
                  setProfile({
                    ...profile,
                    age: e.target.value === "" ? "" : Number(e.target.value)
                  })
                }
                className="h-10"
              />
            </div>
          </div>

          <div className="flex items-end justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px] space-y-1.5">
              <Label className="text-xs text-gray-300">Objetivo Atual</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-white"
                value={profile.goal}
                onChange={e => setProfile({ ...profile, goal: e.target.value })}
              >
                <option value="Hipertrofia (Ganho de Massa)">Hipertrofia (Ganho de Massa)</option>
                <option value="Definição e Redução de Gordura">Definição e Redução de Gordura</option>
                <option value="Ganho de Força">Ganho de Força</option>
                <option value="Condicionamento e Saúde">Condicionamento e Saúde</option>
              </select>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={handleSaveProfileOnly}
              disabled={saving}
              className="h-10 font-semibold"
            >
              Salvar Dados Pessoais
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* FORMULÁRIO PARA ATUALIZAR PESO E MEDIDAS */}
      <Card className="bg-card/25 backdrop-blur-xl border-white/10 shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            <CardTitle className="text-xl text-white">Atualizar Peso e Medidas</CardTitle>
          </div>
          <CardDescription className="text-gray-300 text-xs">
            Sempre que se pesar ou tirar medidas, registre abaixo. O sistema salva a nova medição e mantém todas as anteriores no histórico para comparação!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveMeasurement} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-200">Data da Medição</Label>
                <Input
                  type="date"
                  value={entryDate}
                  onChange={e => setEntryDate(e.target.value)}
                  className="h-10"
                  required
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs text-gray-200">Observação (Opcional)</Label>
                <Input
                  placeholder="Ex: Em jejum pela manhã / Pós-treino..."
                  value={formMetrics.notes}
                  onChange={e => setFormMetrics({ ...formMetrics, notes: e.target.value })}
                  className="h-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {METRIC_FIELDS.map(field => {
                const lastVal = latestEntry ? latestEntry[field.key] : null
                return (
                  <div key={field.key} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-200">
                        {field.label} ({field.unit})
                      </Label>
                      {lastVal !== null && lastVal !== undefined && (
                        <span className="text-[10px] text-primary font-semibold">
                          Atual: {lastVal}
                          {field.unit}
                        </span>
                      )}
                    </div>
                    <Input
                      type="number"
                      step="0.1"
                      inputMode="decimal"
                      placeholder={field.placeholder}
                      value={formMetrics[field.key] || ""}
                      onChange={e =>
                        setFormMetrics({ ...formMetrics, [field.key]: e.target.value })
                      }
                      className="h-10"
                    />
                  </div>
                )
              })}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full font-bold h-12 text-base shadow-lg shadow-primary/25 mt-2"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Plus className="w-5 h-5 mr-2" />
              )}
              Salvar Nova Medição no Histórico
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* HISTÓRICO COMPLETO DE PESO E MEDIDAS */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Ruler className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-white">
            Histórico de Peso e Medidas ({history.length})
          </h2>
        </div>

        {history.length === 0 ? (
          <Card className="bg-card/20 backdrop-blur-xl border-white/10 text-center py-10">
            <CardContent className="space-y-2">
              <Scale className="w-10 h-10 text-muted-foreground mx-auto opacity-60" />
              <p className="text-white font-semibold">Nenhuma medição salva ainda</p>
              <p className="text-xs text-gray-400">
                Preencha seu peso e medidas no formulário acima e clique em Salvar para iniciar seu acompanhamento de evolução.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {history.map((entry, idx) => {
              const prev = history[idx + 1] || null
              const dateLabel = new Date(entry.date + "T12:00:00").toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
              })

              return (
                <Card
                  key={entry.id}
                  className={`bg-card/25 backdrop-blur-xl ${
                    idx === 0 ? "border-primary/50" : "border-white/10"
                  } shadow-xl overflow-hidden`}
                >
                  <CardHeader className="py-3 px-4 bg-white/5 border-b border-white/10 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="font-bold text-white text-sm sm:text-base">
                        {dateLabel}
                      </span>
                      {idx === 0 && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                          Medição Atual
                        </span>
                      )}
                      {idx === history.length - 1 && history.length > 1 && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-white/15 text-gray-200 px-2 py-0.5 rounded-full">
                          1ª Medição (Início)
                        </span>
                      )}
                      {entry.notes && (
                        <span className="text-xs text-gray-300 italic">• "{entry.notes}"</span>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-destructive hover:bg-destructive/15"
                      onClick={() => handleDeleteEntry(entry.id, dateLabel)}
                      title="Excluir esta medição"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardHeader>

                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {METRIC_FIELDS.map(field => {
                        const val = entry[field.key]
                        if (val === null || val === undefined) return null
                        const prevVal = prev ? prev[field.key] : null

                        return (
                          <div
                            key={field.key}
                            className="px-3 py-2 rounded-lg bg-background/50 border border-white/10 flex flex-col gap-1"
                          >
                            <span className="text-[11px] text-gray-400">{field.label}</span>
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-white text-sm sm:text-base">
                                {val}
                                <span className="text-xs font-normal text-gray-400 ml-0.5">
                                  {field.unit}
                                </span>
                              </span>
                              {prev && formatDiffBadge(val, prevVal, field.unit)}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
