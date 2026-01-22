import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword, getCurrentUser } from "@/lib/auth"
import { validateApiKey } from "@/lib/api-auth"

// Listar usuários (requer sessão de admin ou API key)
export async function GET(request: Request) {
  try {
    // Verificar autenticação: sessão ou API key
    const currentUser = await getCurrentUser()
    const apiKeyAuth = validateApiKey(request)
    
    if (!currentUser && !apiKeyAuth.valid) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }
    
    // Se autenticado por sessão, verificar se é admin
    if (currentUser && currentUser.cargo !== "admin") {
      return NextResponse.json({ error: "Acesso negado. Apenas administradores podem listar usuários." }, { status: 403 })
    }

    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        cargo: true,
        ativo: true,
        createdAt: true,
      },
      orderBy: { nome: "asc" },
    })

    return NextResponse.json(usuarios)
  } catch (error) {
    console.error("Erro ao listar usuários:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

// Criar usuário (requer sessão de admin ou API key)
export async function POST(request: Request) {
  try {
    // Verificar autenticação: sessão ou API key
    const currentUser = await getCurrentUser()
    const apiKeyAuth = validateApiKey(request)
    
    if (!currentUser && !apiKeyAuth.valid) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }
    
    // Se autenticado por sessão, verificar se é admin
    if (currentUser && currentUser.cargo !== "admin") {
      return NextResponse.json({ error: "Acesso negado. Apenas administradores podem criar usuários." }, { status: 403 })
    }

    const { nome, email, senha, cargo } = await request.json()

    if (!nome || !email || !senha) {
      return NextResponse.json({ error: "Nome, email e senha são obrigatórios" }, { status: 400 })
    }

    const existingUser = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json({ error: "Email já cadastrado" }, { status: 400 })
    }

    const usuario = await prisma.usuario.create({
      data: {
        nome,
        email: email.toLowerCase(),
        senha: hashPassword(senha),
        cargo: cargo || "tecnico",
      },
      select: {
        id: true,
        nome: true,
        email: true,
        cargo: true,
        ativo: true,
      },
    })

    return NextResponse.json(usuario, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar usuário:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
