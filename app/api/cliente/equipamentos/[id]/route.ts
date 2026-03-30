import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

// PUT - Atualizar equipamento do cliente autenticado
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const usuario = await getCurrentUser()
    if (!usuario || usuario.cargo !== "cliente" || !usuario.clienteId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401, headers: noCacheHeaders })
    }

    const { id } = await params
    const data = await request.json()

    // Verificar que o equipamento pertence ao cliente
    const existing = await prisma.equipamento.findUnique({ where: { id } })
    if (!existing || existing.clienteId !== usuario.clienteId) {
      return NextResponse.json({ error: "Equipamento nao encontrado" }, { status: 404, headers: noCacheHeaders })
    }

    const updateData: Record<string, unknown> = {}

    // Se estiver apenas atualizando status ativo
    if (data.ativo !== undefined && Object.keys(data).length === 1) {
      updateData.ativo = data.ativo
    } else {
      // Validar campos obrigatorios para edicao completa
      if (!data.tipo?.trim() || !data.fabricante?.trim() || !data.modelo?.trim()) {
        return NextResponse.json(
          { error: "Tipo, fabricante e modelo sao obrigatorios" },
          { status: 400, headers: noCacheHeaders }
        )
      }

      updateData.tipo = data.tipo.trim()
      updateData.fabricante = data.fabricante.trim()
      updateData.modelo = data.modelo.trim()
      updateData.numeroSerie = data.numeroSerie?.trim() || ""

      // Permitir ativar/desativar junto com edicao
      if (data.ativo !== undefined) {
        updateData.ativo = data.ativo
      }
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
      { headers: noCacheHeaders }
    )
  } catch (error) {
    console.error("Erro ao atualizar equipamento do cliente:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500, headers: noCacheHeaders })
  }
}

// DELETE - Excluir ou inativar equipamento do cliente autenticado
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const usuario = await getCurrentUser()
    if (!usuario || usuario.cargo !== "cliente" || !usuario.clienteId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401, headers: noCacheHeaders })
    }

    const { id } = await params

    // Verificar que o equipamento pertence ao cliente
    const equipamento = await prisma.equipamento.findUnique({
      where: { id },
      select: { id: true, clienteId: true, numeroSerie: true, ativo: true }
    })

    if (!equipamento || equipamento.clienteId !== usuario.clienteId) {
      return NextResponse.json({ error: "Equipamento nao encontrado" }, { status: 404, headers: noCacheHeaders })
    }

    // Verifica se o equipamento está vinculado a alguma OS
    const ordensVinculadas = await prisma.ordemServico.count({
      where: { equipamentoId: id },
    })

    // Verifica se o equipamento está vinculado a alguma solicitação pelo número de série
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
              ? `Equipamento vinculado a ${ordensVinculadas} ordem(ns) de servico`
              : `Equipamento vinculado a ${solicitacoesVinculadas} solicitacao(oes)`,
          id: equipamentoAtualizado.id,
          ativo: equipamentoAtualizado.ativo,
        },
        { headers: noCacheHeaders }
      )
    }

    // Se não houver vínculos, excluir normalmente
    await prisma.equipamento.delete({ where: { id } })
    return NextResponse.json({ success: true, excluido: true }, { headers: noCacheHeaders })
  } catch (error) {
    console.error("Erro ao excluir/inativar equipamento do cliente:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500, headers: noCacheHeaders })
  }
}
