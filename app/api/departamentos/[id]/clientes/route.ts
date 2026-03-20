import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { validateApiKey } from "@/lib/api-auth"

// Listar clientes de um departamento
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

    const clientesDepartamento = await prisma.clienteDepartamento.findMany({
      where: { departamentoId: id },
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

    return NextResponse.json(clientesDepartamento)
  } catch (error) {
    console.error("Erro ao listar clientes do departamento:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

// Adicionar cliente a um departamento (apenas admin)
export async function POST(
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

    const { clienteId, usuarioResponsavelId } = await request.json()

    if (!clienteId) {
      return NextResponse.json({ error: "Cliente e obrigatorio" }, { status: 400 })
    }

    // Verificar se ja existe
    const existing = await prisma.clienteDepartamento.findFirst({
      where: { departamentoId: id, clienteId },
    })

    if (existing) {
      return NextResponse.json({ error: "Cliente ja pertence a este departamento" }, { status: 400 })
    }

    const clienteDepartamento = await prisma.clienteDepartamento.create({
      data: {
        departamentoId: id,
        clienteId,
        usuarioResponsavelId: usuarioResponsavelId || null,
      },
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

    return NextResponse.json(clienteDepartamento, { status: 201 })
  } catch (error) {
    console.error("Erro ao adicionar cliente ao departamento:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
