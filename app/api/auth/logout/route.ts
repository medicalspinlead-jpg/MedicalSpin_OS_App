import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { deleteSession } from "@/lib/auth"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("session_token")?.value

    if (token) {
      await deleteSession(token)
    }

    cookieStore.delete("session_token")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro no logout:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
