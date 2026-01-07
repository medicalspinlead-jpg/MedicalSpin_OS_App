import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const usuario = await getCurrentUser()

    if (!usuario) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    return NextResponse.json({ usuario })
  } catch (error) {
    console.error("Erro ao obter usuário:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
