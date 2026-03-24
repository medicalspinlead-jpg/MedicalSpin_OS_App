import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const usuario = await getCurrentUser()

    if (!usuario) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 })
    }

    // Extrair os departamentos do usuário
    const departamentos = (usuario as any).departamentos?.map((ud: any) => ({
      id: ud.departamento.id,
      nome: ud.departamento.nome,
    })) || []

    return NextResponse.json({
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        telefone: (usuario as any).telefone || null,
        cargo: usuario.cargo,
        clienteId: usuario.clienteId || null,
        departamentos,
        notifEmail: (usuario as any).notifEmail ?? false,
        notifWhatsapp: (usuario as any).notifWhatsapp ?? false,
      },
    })
  } catch (error) {
    console.error("Erro ao obter usuario atual:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
