import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateApiKey } from "@/lib/api-auth"

const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

function mapSolicitacao(s: NonNullable<Awaited<ReturnType<typeof prisma.solicitacao.findUnique>>>) {
  return {
    id: s.id,
    protocolo: s.protocolo,
    status: s.status,
    nomeEmpresa: s.nomeEmpresa,
    cnpj: s.cnpj || "",
    nomeContato: s.nomeContato,
    telefone: s.telefone,
    email: s.email,
    cidade: s.cidade,
    uf: s.uf,
    tipoEquipamento: s.tipoEquipamento,
    fabricante: s.fabricante,
    modelo: s.modelo,
    numeroSerie: s.numeroSerie || "",
    descricaoProblema: s.descricaoProblema,
    urgencia: s.urgencia,
    ordemServicoId: s.ordemServicoId,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }
}

// GET - Busca solicitação por ID (protegido)
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = validateApiKey(request)
  if (!auth.valid) return auth.response

  try {
    const { id } = await params
    const solicitacao = await prisma.solicitacao.findUnique({ where: { id } })

    if (!solicitacao) {
      return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404, headers: noCacheHeaders })
    }

    return NextResponse.json(mapSolicitacao(solicitacao), { headers: noCacheHeaders })
  } catch (error) {
    console.error("Erro ao buscar solicitação:", error)
    return NextResponse.json({ error: "Erro ao buscar solicitação" }, { status: 500, headers: noCacheHeaders })
  }
}

// PUT - Atualiza solicitação (protegido)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = validateApiKey(request)
  if (!auth.valid) return auth.response

  try {
    const { id } = await params
    const data = await request.json()

    const solicitacao = await prisma.solicitacao.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.ordemServicoId !== undefined && { ordemServicoId: data.ordemServicoId }),
      },
    })

    return NextResponse.json(mapSolicitacao(solicitacao), { headers: noCacheHeaders })
  } catch (error) {
    console.error("Erro ao atualizar solicitação:", error)
    return NextResponse.json({ error: "Erro ao atualizar solicitação" }, { status: 500, headers: noCacheHeaders })
  }
}

// DELETE - Exclui solicitação (protegido)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = validateApiKey(request)
  if (!auth.valid) return auth.response

  try {
    const { id } = await params
    await prisma.solicitacao.delete({ where: { id } })
    return NextResponse.json({ success: true }, { headers: noCacheHeaders })
  } catch (error) {
    console.error("Erro ao excluir solicitação:", error)
    return NextResponse.json({ error: "Erro ao excluir solicitação" }, { status: 500, headers: noCacheHeaders })
  }
}
