import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

// GET - Busca solicitação por protocolo (público, sem auth)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const protocolo = searchParams.get("protocolo")

    if (!protocolo || protocolo.trim() === "") {
      return NextResponse.json(
        { error: "Protocolo é obrigatório" },
        { status: 400, headers: noCacheHeaders }
      )
    }

    const solicitacao = await prisma.solicitacao.findUnique({
      where: { protocolo: protocolo.trim().toUpperCase() },
    })

    if (!solicitacao) {
      return NextResponse.json(
        { error: "Solicitação não encontrada. Verifique o número do protocolo." },
        { status: 404, headers: noCacheHeaders }
      )
    }

    // Retorna apenas dados públicos relevantes para o cliente
    return NextResponse.json({
      protocolo: solicitacao.protocolo,
      status: solicitacao.status,
      nomeEmpresa: solicitacao.nomeEmpresa,
      tipoEquipamento: solicitacao.tipoEquipamento,
      fabricante: solicitacao.fabricante,
      modelo: solicitacao.modelo,
      descricaoProblema: solicitacao.descricaoProblema,
      urgencia: solicitacao.urgencia,
      createdAt: solicitacao.createdAt.toISOString(),
      updatedAt: solicitacao.updatedAt.toISOString(),
    }, { headers: noCacheHeaders })
  } catch (error) {
    console.error("Erro ao buscar solicitação por protocolo:", error)
    return NextResponse.json({ error: "Erro ao buscar solicitação" }, { status: 500, headers: noCacheHeaders })
  }
}
