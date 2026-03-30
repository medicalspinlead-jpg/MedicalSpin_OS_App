import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { validateApiKey } from "@/lib/api-auth"

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
      return NextResponse.json({ error: "Acesso negado. Apenas administradores podem ver usuarios pendentes." }, { status: 403 })
    }

    const usuariosPendentes = await prisma.usuario.findMany({
      where: {
        aprovado: false,
        cargo: "cliente",
      },
      select: {
        id: true,
        nome: true,
        email: true,
        cargo: true,
        ativo: true,
        aprovado: true,
        createdAt: true,
        cliente: {
          select: {
            id: true,
            razaoSocial: true,
            nomeFantasia: true,
            cnpj: true,
            cidade: true,
            uf: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(usuariosPendentes)
  } catch (error) {
    console.error("Erro ao listar usuarios pendentes:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
