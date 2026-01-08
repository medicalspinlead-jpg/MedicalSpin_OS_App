import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session_token")
    console.log("[v0] Auth/me: Cookie session_token existe:", !!sessionToken)
    console.log(
      "[v0] Auth/me: Todos os cookies:",
      cookieStore.getAll().map((c) => c.name),
    )

    const usuario = await getCurrentUser()
    console.log("[v0] Auth/me: Usuário encontrado:", !!usuario)

    if (!usuario) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    return NextResponse.json({ usuario })
  } catch (error) {
    console.error("[v0] Auth/me ERRO:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
