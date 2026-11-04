"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, PlayCircle, ExternalLink, X, RefreshCw } from "lucide-react"

type ExerciseVideoModalProps = {
  exerciseName: string
  targetMuscle?: string
}

export function ExerciseVideoButton({ exerciseName, targetMuscle }: ExerciseVideoModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [videoIds, setVideoIds] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [searchUrl, setSearchUrl] = useState("")

  useEffect(() => {
    if (!isOpen) return

    const query = `como executar ${exerciseName} ${targetMuscle || ""} execução correta academia`.trim()
    const defaultSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
    setSearchUrl(defaultSearchUrl)

    if (videoIds.length > 0) return

    let active = true
    setLoading(true)

    fetch(
      `/api/exercise-video?name=${encodeURIComponent(exerciseName)}&muscle=${encodeURIComponent(
        targetMuscle || ""
      )}`
    )
      .then(res => res.json())
      .then(data => {
        if (!active) return
        if (data?.videoIds && Array.isArray(data.videoIds)) {
          setVideoIds(data.videoIds)
          setCurrentIndex(0)
        }
        if (data?.searchUrl) {
          setSearchUrl(data.searchUrl)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [isOpen, exerciseName, targetMuscle, videoIds.length])

  const currentVideoId = videoIds[currentIndex] || null

  const nextVideo = () => {
    if (videoIds.length <= 1) return
    setCurrentIndex(prev => (prev + 1) % videoIds.length)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-600/20 hover:bg-red-600/35 text-red-400 border border-red-500/40 transition-all shrink-0 shadow-sm active:scale-95"
        title={`Ver vídeo de execução: ${exerciseName}`}
      >
        <PlayCircle className="w-3.5 h-3.5 fill-red-500/20 text-red-400" />
        <span>Vídeo</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-white/15 shadow-2xl overflow-hidden space-y-4 p-4 sm:p-5"
            onClick={e => e.stopPropagation()}
          >
            {/* Cabeçalho do Modal */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-red-400 bg-red-500/15 border border-red-500/30 px-2.5 py-0.5 rounded-full">
                  <PlayCircle className="w-3.5 h-3.5" />
                  Como Executar o Exercício
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white mt-1.5">{exerciseName}</h3>
                {targetMuscle && (
                  <p className="text-xs text-gray-400">Músculo alvo: {targetMuscle}</p>
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-white rounded-full shrink-0"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Player do YouTube */}
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-white/10 flex items-center justify-center">
              {loading ? (
                <div className="flex flex-col items-center gap-2 text-gray-300">
                  <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                  <p className="text-xs font-medium">Buscando vídeo de execução no YouTube...</p>
                </div>
              ) : currentVideoId ? (
                <iframe
                  key={currentVideoId}
                  src={`https://www.youtube.com/embed/${currentVideoId}?autoplay=1&rel=0`}
                  title={`Execução de ${exerciseName}`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="text-center p-6 space-y-3">
                  <p className="text-sm text-gray-300">
                    Clique abaixo para abrir os vídeos de execução diretamente no YouTube:
                  </p>
                  <a
                    href={searchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Assistir no YouTube
                  </a>
                </div>
              )}
            </div>

            {/* Rodapé com opções de trocar vídeo ou abrir no app do YouTube */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                {videoIds.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={nextVideo}
                    className="text-xs border-white/15 bg-white/5 hover:bg-white/10 text-gray-200"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    Outro vídeo ({currentIndex + 1}/{videoIds.length})
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <a
                  href={
                    currentVideoId
                      ? `https://www.youtube.com/watch?v=${currentVideoId}`
                      : searchUrl
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors shadow-md"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Abrir no YouTube
                </a>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="text-xs font-semibold"
                  onClick={() => setIsOpen(false)}
                >
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
