import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

// GET - Detalhes de uma solicitacao (somente se pertence ao cliente)
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const usuario = await getCurrentUser()
    if (!usuario || usuario.cargo !== "cliente" || !usuario.clienteId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401, headers: noCacheHeaders })
    }

    const { id } = await params

    const solicitacao = await prisma.solicitacao.findUnique({
      where: { id },
    })

    if (!solicitacao) {
      return NextResponse.json({ error: "Solicitacao nao encontrada" }, { status: 404, headers: noCacheHeaders })
    }

    // Verificar se pertence ao cliente
    if (solicitacao.clienteId !== usuario.clienteId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403, headers: noCacheHeaders })
    }

    return NextResponse.json(
      {
        id: solicitacao.id,
        protocolo: solicitacao.protocolo,
        status: solicitacao.status,
        nomeEmpresa: solicitacao.nomeEmpresa,
        cnpj: solicitacao.cnpj || "",
        nomeContato: solicitacao.nomeContato,
        telefone: solicitacao.telefone,
        email: solicitacao.email,
        cidade: solicitacao.cidade,
        uf: solicitacao.uf,
        tipoEquipamento: solicitacao.tipoEquipamento,
        fabricante: solicitacao.fabricante,
        modelo: solicitacao.modelo,
        numeroSerie: solicitacao.numeroSerie || "",
        descricaoProblema: solicitacao.descricaoProblema,
        urgencia: solicitacao.urgencia,
        ordemServicoId: solicitacao.ordemServicoId,
        clienteId: solicitacao.clienteId,
        midias: (solicitacao.midias as Record<string, unknown>) || {},
        motivoCancelamento: solicitacao.motivoCancelamento || null,
        createdAt: solicitacao.createdAt.toISOString(),
        updatedAt: solicitacao.updatedAt.toISOString(),
      },
      { headers: noCacheHeaders }
    )
  } catch (error) {
    console.error("Erro ao buscar solicitacao:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500, headers: noCacheHeaders })
  }
}
