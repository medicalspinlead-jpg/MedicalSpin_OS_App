import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { validateApiKey } from "@/lib/api-auth"

// Listar usuarios de um departamento
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

    const usuariosDepartamento = await prisma.usuarioDepartamento.findMany({
      where: { departamentoId: id },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            cargo: true,
          },
        },
      },
    })

    return NextResponse.json(usuariosDepartamento)
  } catch (error) {
    console.error("Erro ao listar usuarios do departamento:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

// Adicionar usuario a um departamento (apenas admin)
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

    const { usuarioId } = await request.json()

    if (!usuarioId) {
      return NextResponse.json({ error: "Usuario e obrigatorio" }, { status: 400 })
    }

    // Verificar se ja existe
    const existing = await prisma.usuarioDepartamento.findFirst({
      where: { departamentoId: id, usuarioId },
    })

    if (existing) {
      return NextResponse.json({ error: "Usuario ja pertence a este departamento" }, { status: 400 })
    }

    const usuarioDepartamento = await prisma.usuarioDepartamento.create({
      data: {
        departamentoId: id,
        usuarioId,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            cargo: true,
          },
        },
      },
    })

    return NextResponse.json(usuarioDepartamento, { status: 201 })
  } catch (error) {
    console.error("Erro ao adicionar usuario ao departamento:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
