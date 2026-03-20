import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { validateApiKey } from "@/lib/api-auth"

// Buscar departamento por ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()
    const apiKeyAuth = validateApiKey(request)
    
    if (!currentUser && !apiKeyAuth.valid) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 })
    }

    const departamento = await prisma.departamento.findUnique({
      where: { id },
    })

    if (!departamento) {
      return NextResponse.json({ error: "Departamento nao encontrado" }, { status: 404 })
    }

    return NextResponse.json(departamento)
  } catch (error) {
    console.error("Erro ao buscar departamento:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

// Atualizar departamento (apenas admin)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()
    const apiKeyAuth = validateApiKey(request)
    
    if (!currentUser && !apiKeyAuth.valid) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 })
    }
    
    if (currentUser && currentUser.cargo !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const data = await request.json()

    const departamento = await prisma.departamento.update({
      where: { id },
      data: {
        ...(data.nome && { nome: data.nome }),
        ...(data.descricao !== undefined && { descricao: data.descricao }),
        ...(data.cor && { cor: data.cor }),
        ...(data.icone && { icone: data.icone }),
        ...(data.ativo !== undefined && { ativo: data.ativo }),
      },
    })

    return NextResponse.json(departamento)
  } catch (error) {
    console.error("Erro ao atualizar departamento:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

// Excluir departamento (apenas admin)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()
    const apiKeyAuth = validateApiKey(request)
    
    if (!currentUser && !apiKeyAuth.valid) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 })
    }
    
    if (currentUser && currentUser.cargo !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Soft delete - apenas inativa
    await prisma.departamento.update({
      where: { id },
      data: { ativo: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao excluir departamento:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
