import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateApiKey } from "@/lib/api-auth"

const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

// Garante que a coluna `ativo` existe na tabela, aplicando a migration automaticamente se necessário
async function ensureAtivoColumn() {
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE equipamentos ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true`,
    )
  } catch {
    // coluna já existe ou banco não suporta IF NOT EXISTS — ignorar silenciosamente
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = validateApiKey(request)
  if (!auth.valid) return auth.response

  try {
    await ensureAtivoColumn()
    const { id } = await params
    const data = await request.json()

    const updateData: Record<string, unknown> = {
      tipo: data.tipo,
      fabricante: data.fabricante,
      modelo: data.modelo,
      numeroSerie: data.numeroSerie,
    }

    if (data.ativo !== undefined) {
      updateData.ativo = data.ativo
    }

    const equipamento = await prisma.equipamento.update({
      where: { id },
      data: updateData,
    })
    return NextResponse.json(
      {
        id: equipamento.id,
        clienteId: equipamento.clienteId,
        tipo: equipamento.tipo,
        fabricante: equipamento.fabricante,
        modelo: equipamento.modelo,
        numeroSerie: equipamento.numeroSerie,
        ativo: equipamento.ativo,
        createdAt: equipamento.createdAt.toISOString(),
      },
      { headers: noCacheHeaders },
    )
  } catch (error) {
    console.error("Erro ao atualizar equipamento:", error)
    return NextResponse.json({ error: "Erro ao atualizar equipamento" }, { status: 500, headers: noCacheHeaders })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = validateApiKey(request)
  if (!auth.valid) return auth.response

  try {
    await ensureAtivoColumn()
    const { id } = await params

    // Verifica se o equipamento está vinculado a alguma OS
    const ordensVinculadas = await prisma.ordemServico.count({
      where: { equipamentoId: id },
    })

    // Verifica se o equipamento está vinculado a alguma solicitação pelo número de série
    const equipamento = await prisma.equipamento.findUnique({
      where: { id },
      select: { numeroSerie: true, ativo: true },
    })

    if (!equipamento) {
      return NextResponse.json({ error: "Equipamento não encontrado" }, { status: 404, headers: noCacheHeaders })
    }

    let solicitacoesVinculadas = 0
    if (equipamento.numeroSerie) {
      solicitacoesVinculadas = await prisma.solicitacao.count({
        where: { numeroSerie: equipamento.numeroSerie },
      })
    }

    // Se houver vínculos, inativar em vez de excluir
    if (ordensVinculadas > 0 || solicitacoesVinculadas > 0) {
      const equipamentoAtualizado = await prisma.equipamento.update({
        where: { id },
        data: { ativo: false },
      })
      return NextResponse.json(
        {
          inativado: true,
          motivo:
            ordensVinculadas > 0
              ? `Equipamento vinculado a ${ordensVinculadas} ordem(ns) de serviço`
              : `Equipamento vinculado a ${solicitacoesVinculadas} solicitação(ões)`,
          id: equipamentoAtualizado.id,
          ativo: equipamentoAtualizado.ativo,
        },
        { headers: noCacheHeaders },
      )
    }

    // Se não houver vínculos, excluir normalmente
    await prisma.equipamento.delete({ where: { id } })
    return NextResponse.json({ success: true, excluido: true }, { headers: noCacheHeaders })
  } catch (error) {
    console.error("Erro ao excluir/inativar equipamento:", error)
    return NextResponse.json({ error: "Erro ao excluir equipamento" }, { status: 500, headers: noCacheHeaders })
  }
}
