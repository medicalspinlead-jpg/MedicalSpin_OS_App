import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateApiKey } from "@/lib/api-auth"

const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = validateApiKey(request)
  if (!auth.valid) return auth.response

  try {
    const { id } = await params
    const data = await request.json()
    const equipamento = await prisma.equipamento.update({
      where: { id },
      data: {
        tipo: data.tipo,
        fabricante: data.fabricante,
        modelo: data.modelo,
        numeroSerie: data.numeroSerie,
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
    const { id } = await params
    await prisma.equipamento.delete({ where: { id } })
    return NextResponse.json({ success: true }, { headers: noCacheHeaders })
  } catch (error) {
    console.error("Erro ao excluir equipamento:", error)
    return NextResponse.json({ error: "Erro ao excluir equipamento" }, { status: 500, headers: noCacheHeaders })
  }
}
