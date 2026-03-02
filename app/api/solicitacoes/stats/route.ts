import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateApiKey } from "@/lib/api-auth"

const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

// GET - Retorna estatisticas de solicitacoes (por status e por tecnico)
export async function GET(request: Request) {
  const auth = validateApiKey(request)
  if (!auth.valid) return auth.response

  try {
    // Contagem por status
    const solicitacoes = await prisma.solicitacao.findMany({
      select: { status: true },
    })

    const porStatus: Record<string, number> = {}
    for (const s of solicitacoes) {
      porStatus[s.status] = (porStatus[s.status] || 0) + 1
    }

    // Contagem por tecnico (busca no historico de status quem alterou)
    const historico = await prisma.historicoStatusSolicitacao.findMany({
      where: {
        usuarioNome: { not: null },
      },
      select: {
        usuarioNome: true,
        status: true,
      },
    })

    // Agrupa por tecnico e status
    const tecnicoMap: Record<string, Record<string, number>> = {}
    for (const h of historico) {
      const nome = h.usuarioNome || "Desconhecido"
      if (!tecnicoMap[nome]) tecnicoMap[nome] = {}
      tecnicoMap[nome][h.status] = (tecnicoMap[nome][h.status] || 0) + 1
    }

    const porTecnico = Object.entries(tecnicoMap).map(([nome, statusCounts]) => ({
      nome,
      em_progresso: statusCounts["em_progresso"] || 0,
      finalizada: statusCounts["finalizada"] || 0,
      cancelada: statusCounts["cancelada"] || 0,
      total:
        (statusCounts["em_progresso"] || 0) +
        (statusCounts["finalizada"] || 0) +
        (statusCounts["cancelada"] || 0),
    }))

    return NextResponse.json(
      {
        porStatus,
        porTecnico,
        total: solicitacoes.length,
      },
      { headers: noCacheHeaders }
    )
  } catch (error) {
    console.error("Erro ao buscar estatisticas:", error)
    return NextResponse.json(
      { error: "Erro ao buscar estatisticas" },
      { status: 500, headers: noCacheHeaders }
    )
  }
}
