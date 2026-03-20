import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { validateApiKey } from "@/lib/api-auth"

// Atualizar responsavel do cliente no departamento
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; clienteId: string }> }
) {
  try {
    const { id, clienteId } = await params
    const currentUser = await getCurrentUser()
    const apiKeyAuth = validateApiKey(request)
    
    if (!currentUser && !apiKeyAuth.valid) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 })
    }
    
    if (currentUser && currentUser.cargo !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const { usuarioResponsavelId } = await request.json()

    const clienteDepartamento = await prisma.clienteDepartamento.updateMany({
      where: { departamentoId: id, clienteId },
      data: { usuarioResponsavelId: usuarioResponsavelId || null },
    })

    if (clienteDepartamento.count === 0) {
      return NextResponse.json({ error: "Registro nao encontrado" }, { status: 404 })
    }

    const updated = await prisma.clienteDepartamento.findFirst({
      where: { departamentoId: id, clienteId },
      include: {
        cliente: true,
        usuarioResponsavel: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Erro ao atualizar responsavel:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

// Remover cliente de um departamento (apenas admin)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; clienteId: string }> }
) {
  try {
    const { id, clienteId } = await params
    const currentUser = await getCurrentUser()
    const apiKeyAuth = validateApiKey(request)
    
    if (!currentUser && !apiKeyAuth.valid) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 })
    }
    
    if (currentUser && currentUser.cargo !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    await prisma.clienteDepartamento.deleteMany({
      where: { departamentoId: id, clienteId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao remover cliente do departamento:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
