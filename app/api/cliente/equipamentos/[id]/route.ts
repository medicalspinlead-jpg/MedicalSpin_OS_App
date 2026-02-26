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

    if (!data.tipo?.trim() || !data.fabricante?.trim() || !data.modelo?.trim()) {
      return NextResponse.json(
        { error: "Tipo, fabricante e modelo sao obrigatorios" },
        { status: 400, headers: noCacheHeaders }
      )
    }

    const equipamento = await prisma.equipamento.update({
      where: { id },
      data: {
        tipo: data.tipo.trim(),
        fabricante: data.fabricante.trim(),
        modelo: data.modelo.trim(),
        numeroSerie: data.numeroSerie?.trim() || "",
      },
    })

    return NextResponse.json(
      {
        id: equipamento.id,
        clienteId: equipamento.clienteId,
        tipo: equipamento.tipo,
        fabricante: equipamento.fabricante,
        modelo: equipamento.modelo,
        numeroSerie: equipamento.numeroSerie,
        createdAt: equipamento.createdAt.toISOString(),
      },
      { headers: noCacheHeaders }
    )
  } catch (error) {
    console.error("Erro ao atualizar equipamento do cliente:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500, headers: noCacheHeaders })
  }
}

// DELETE - Excluir equipamento do cliente autenticado
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const usuario = await getCurrentUser()
    if (!usuario || usuario.cargo !== "cliente" || !usuario.clienteId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401, headers: noCacheHeaders })
    }

    const { id } = await params

    // Verificar que o equipamento pertence ao cliente
    const existing = await prisma.equipamento.findUnique({ where: { id } })
    if (!existing || existing.clienteId !== usuario.clienteId) {
      return NextResponse.json({ error: "Equipamento nao encontrado" }, { status: 404, headers: noCacheHeaders })
    }

    await prisma.equipamento.delete({ where: { id } })
    return NextResponse.json({ success: true }, { headers: noCacheHeaders })
  } catch (error) {
    console.error("Erro ao excluir equipamento do cliente:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500, headers: noCacheHeaders })
  }
}
