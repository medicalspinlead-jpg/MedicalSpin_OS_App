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

    // Contagem por tecnico baseada no STATUS ATUAL de cada solicitacao
    // Para cada solicitacao, pega o ultimo registro do historico com tecnico identificado
    // e conta apenas o status atual da solicitacao (nao todos os historicos)
    const solicitacoesComHistorico = await prisma.solicitacao.findMany({
      where: {
        status: { in: ["em_progresso", "finalizada", "cancelada"] },
      },
      select: {
        id: true,
        status: true,
        historicoStatus: {
          where: { usuarioNome: { not: null } },
          orderBy: { criadoEm: "desc" },
          take: 1,
          select: { usuarioNome: true },
        },
      },
    })

    // Agrupa: para cada solicitacao, atribui o status atual ao ultimo tecnico que atuou
    const tecnicoMap: Record<string, Record<string, number>> = {}
    for (const sol of solicitacoesComHistorico) {
      const ultimoTecnico = sol.historicoStatus[0]?.usuarioNome
      if (!ultimoTecnico) continue
      if (!tecnicoMap[ultimoTecnico]) tecnicoMap[ultimoTecnico] = {}
      tecnicoMap[ultimoTecnico][sol.status] = (tecnicoMap[ultimoTecnico][sol.status] || 0) + 1
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
