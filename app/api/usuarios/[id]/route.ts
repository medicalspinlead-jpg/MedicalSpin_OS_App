import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword, getCurrentUser } from "@/lib/auth"
import { validateApiKey } from "@/lib/api-auth"

// Buscar usuário por ID (requer sessão ou API key)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    const apiKeyAuth = validateApiKey(request)
    
    if (!currentUser && !apiKeyAuth.valid) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { id } = await params

    // Se autenticado por sessão, usuários podem ver seus próprios dados, admins podem ver todos
    // Se autenticado por API key, pode ver todos
    if (currentUser && currentUser.cargo !== "admin" && currentUser.id !== id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        cargo: true,
        ativo: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!usuario) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    return NextResponse.json(usuario)
  } catch (error) {
    console.error("Erro ao buscar usuário:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

// Atualizar usuário (requer sessão ou API key)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    const apiKeyAuth = validateApiKey(request)
    
    if (!currentUser && !apiKeyAuth.valid) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()

    // Se autenticado por API key, permite tudo (como admin)
    // Se autenticado por sessão, usuários podem editar seus próprios dados (exceto cargo e ativo), admins podem editar tudo
    const isApiKey = apiKeyAuth.valid
    const isAdmin = currentUser?.cargo === "admin"
    const isSelf = currentUser?.id === id

    if (!isApiKey && !isAdmin && !isSelf) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Verificar se usuário existe
    const existingUser = await prisma.usuario.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Preparar dados para atualização
    const updateData: {
      nome?: string
      email?: string
      senha?: string
      cargo?: string
      ativo?: boolean
    } = {}

    // Campos que qualquer usuário pode editar em si mesmo
    if (data.nome) updateData.nome = data.nome
    if (data.email) {
      // Verificar se email já existe em outro usuário
      const emailExists = await prisma.usuario.findFirst({
        where: {
          email: data.email.toLowerCase(),
          id: { not: id },
        },
      })
      if (emailExists) {
        return NextResponse.json({ error: "Email já cadastrado" }, { status: 400 })
      }
      updateData.email = data.email.toLowerCase()
    }
    if (data.senha) {
      updateData.senha = hashPassword(data.senha)
    }

    // Campos que apenas admin ou API key pode editar
    if (isAdmin || isApiKey) {
      if (data.cargo !== undefined) updateData.cargo = data.cargo
      if (data.ativo !== undefined) updateData.ativo = data.ativo
    }

    const usuario = await prisma.usuario.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nome: true,
        email: true,
        cargo: true,
        ativo: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(usuario)
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

// Deletar usuário (requer sessão de admin ou API key)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    const apiKeyAuth = validateApiKey(request)
    
    if (!currentUser && !apiKeyAuth.valid) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }
    
    // Se autenticado por sessão, verificar se é admin
    if (currentUser && currentUser.cargo !== "admin") {
      return NextResponse.json({ error: "Acesso negado. Apenas administradores podem deletar usuários." }, { status: 403 })
    }

    const { id } = await params

    // Não permitir que admin delete a si mesmo (apenas para sessão)
    if (currentUser && currentUser.id === id) {
      return NextResponse.json({ error: "Não é possível deletar seu próprio usuário" }, { status: 400 })
    }

    // Verificar se usuário existe
    const existingUser = await prisma.usuario.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Deletar sessões do usuário primeiro
    await prisma.sessao.deleteMany({
      where: { usuarioId: id },
    })

    // Deletar usuário
    await prisma.usuario.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Usuário deletado com sucesso" })
  } catch (error) {
    console.error("Erro ao deletar usuário:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
