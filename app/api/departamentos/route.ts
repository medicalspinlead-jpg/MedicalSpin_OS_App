import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { validateApiKey } from "@/lib/api-auth"

// Listar departamentos
export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser()
    const apiKeyAuth = validateApiKey(request)
    
    if (!currentUser && !apiKeyAuth.valid) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 })
    }

    const departamentos = await prisma.departamento.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
    })

    return NextResponse.json(departamentos)
  } catch (error) {
    console.error("Erro ao listar departamentos:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

// Criar departamento (apenas admin)
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser()
    const apiKeyAuth = validateApiKey(request)
    
    if (!currentUser && !apiKeyAuth.valid) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 })
    }
    
    if (currentUser && currentUser.cargo !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const { nome, descricao, cor, icone } = await request.json()

    if (!nome) {
      return NextResponse.json({ error: "Nome e obrigatorio" }, { status: 400 })
    }

    const departamento = await prisma.departamento.create({
      data: {
        nome,
        descricao: descricao || null,
        cor: cor || "#3b82f6",
        icone: icone || "Building2",
      },
    })

    return NextResponse.json(departamento, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar departamento:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
