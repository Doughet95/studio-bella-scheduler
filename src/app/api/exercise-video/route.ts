import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const name = searchParams.get("name")?.trim() || ""
    const muscle = searchParams.get("muscle")?.trim() || ""

    if (!name) {
      return NextResponse.json({ videoIds: [], searchUrl: "https://www.youtube.com" })
    }

    const searchQuery = `como executar ${name} ${muscle} execução correta academia`.trim()
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`

    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8"
      },
      next: { revalidate: 86400 }
    })

    const html = await res.text()
    const regex = /"videoId":"([a-zA-Z0-9_-]{11})"/g
    const uniqueIds: string[] = []
    let match: RegExpExecArray | null

    while ((match = regex.exec(html)) !== null) {
      const id = match[1]
      if (!uniqueIds.includes(id)) {
        uniqueIds.push(id)
      }
      if (uniqueIds.length >= 5) break
    }

    return NextResponse.json({
      videoIds: uniqueIds,
      searchUrl
    })
  } catch (error) {
    console.error("Erro ao buscar vídeo do exercício:", error)
    return NextResponse.json({ videoIds: [], searchUrl: "https://www.youtube.com" })
  }
}
