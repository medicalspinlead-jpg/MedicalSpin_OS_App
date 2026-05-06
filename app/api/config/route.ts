import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// GET - Obter configurações
export async function GET() {
  try {
    let config = await prisma.configuracao.findFirst()
    
    if (!config) {
      // Criar configuração padrão se não existir
      config = await prisma.configuracao.create({
        data: {
          emailHabilitado: true,
          armazenarNoDrive: true,
        },
      })
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error("Erro ao buscar configurações:", error)
    return NextResponse.json({ error: "Erro ao buscar configurações" }, { status: 500 })
  }
}

// PUT - Atualizar configurações (apenas admin)
export async function PUT(request: Request) {
  try {
    const usuario = await getCurrentUser()
    
    if (!usuario) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (usuario.cargo !== "admin") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
    }

    const body = await request.json()
    const { emailHabilitado, armazenarNoDrive } = body

    let config = await prisma.configuracao.findFirst()

    const updateData: { emailHabilitado?: boolean; armazenarNoDrive?: boolean } = {}
    if (typeof emailHabilitado === "boolean") {
      updateData.emailHabilitado = emailHabilitado
    }
    if (typeof armazenarNoDrive === "boolean") {
      updateData.armazenarNoDrive = armazenarNoDrive
    }

    if (config) {
      config = await prisma.configuracao.update({
        where: { id: config.id },
        data: updateData,
      })
    } else {
      config = await prisma.configuracao.create({
        data: { 
          emailHabilitado: emailHabilitado ?? true,
          armazenarNoDrive: armazenarNoDrive ?? true,
        },
      })
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error("Erro ao atualizar configurações:", error)
    return NextResponse.json({ error: "Erro ao atualizar configurações" }, { status: 500 })
  }
}
