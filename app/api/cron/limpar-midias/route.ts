import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Configuração: dias após finalização para apagar mídias
const DIAS_PARA_LIMPAR = 5

// Esta rota pode ser chamada por um cron job da Vercel
// Configure em vercel.json com: "crons": [{ "path": "/api/cron/limpar-midias", "schedule": "0 3 * * *" }]
export async function GET(request: Request) {
  try {
    // Verifica o header de autorização para cron jobs da Vercel
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    // Se CRON_SECRET estiver definido, verifica a autorização
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const dataLimite = new Date()
    dataLimite.setDate(dataLimite.getDate() - DIAS_PARA_LIMPAR)

    // Busca OS finalizadas há mais de X dias que ainda têm mídias
    const osComMidias = await prisma.ordemServico.findMany({
      where: {
        status: "finalizada",
        finalizedAt: {
          lt: dataLimite,
        },
        NOT: {
          midias: {
            equals: {},
          },
        },
      },
      select: {
        id: true,
        numero: true,
        finalizedAt: true,
      },
    })

    // Limpa as mídias das OS encontradas
    const osLimpas: string[] = []
    for (const os of osComMidias) {
      await prisma.ordemServico.update({
        where: { id: os.id },
        data: { midias: {} },
      })
      osLimpas.push(os.numero)
    }

    // Busca solicitações concluídas/canceladas há mais de X dias que ainda têm mídias
    const solicitacoesComMidias = await prisma.solicitacao.findMany({
      where: {
        status: {
          in: ["concluida", "cancelada"],
        },
        updatedAt: {
          lt: dataLimite,
        },
        NOT: {
          midias: {
            equals: {},
          },
        },
      },
      select: {
        id: true,
        protocolo: true,
        updatedAt: true,
      },
    })

    // Limpa as mídias das solicitações encontradas
    const solicitacoesLimpas: string[] = []
    for (const sol of solicitacoesComMidias) {
      await prisma.solicitacao.update({
        where: { id: sol.id },
        data: { midias: {} },
      })
      solicitacoesLimpas.push(sol.protocolo)
    }

    const resultado = {
      sucesso: true,
      dataExecucao: new Date().toISOString(),
      diasParaLimpar: DIAS_PARA_LIMPAR,
      dataLimite: dataLimite.toISOString(),
      ordensServico: {
        encontradas: osComMidias.length,
        limpas: osLimpas,
      },
      solicitacoes: {
        encontradas: solicitacoesComMidias.length,
        limpas: solicitacoesLimpas,
      },
    }

    console.log("[CRON] Limpeza de mídias executada:", resultado)

    return NextResponse.json(resultado)
  } catch (error) {
    console.error("[CRON] Erro ao limpar mídias:", error)
    return NextResponse.json(
      { error: "Erro ao executar limpeza de mídias", detalhes: String(error) },
      { status: 500 }
    )
  }
}
