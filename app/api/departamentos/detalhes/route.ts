import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { validateApiKey } from "@/lib/api-auth"

// Buscar todos departamentos com usuarios e clientes
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

    const usuariosDepartamento = await prisma.usuarioDepartamento.findMany({
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

    const clientesDepartamento = await prisma.clienteDepartamento.findMany({
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

    // Agrupar por departamento
    const usuariosPorDepartamento: Record<string, typeof usuariosDepartamento> = {}
    const clientesPorDepartamento: Record<string, typeof clientesDepartamento> = {}

    for (const ud of usuariosDepartamento) {
      if (!usuariosPorDepartamento[ud.departamentoId]) {
        usuariosPorDepartamento[ud.departamentoId] = []
      }
      usuariosPorDepartamento[ud.departamentoId].push(ud)
    }

    for (const cd of clientesDepartamento) {
      if (!clientesPorDepartamento[cd.departamentoId]) {
        clientesPorDepartamento[cd.departamentoId] = []
      }
      clientesPorDepartamento[cd.departamentoId].push(cd)
    }

    return NextResponse.json({
      departamentos,
      usuariosPorDepartamento,
      clientesPorDepartamento,
    })
  } catch (error) {
    console.error("Erro ao buscar detalhes dos departamentos:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
