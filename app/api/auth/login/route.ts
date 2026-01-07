import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyPassword, createSession } from "@/lib/auth"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const { email, senha } = await request.json()

    if (!email || !senha) {
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!usuario) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
    }

    if (!usuario.ativo) {
      return NextResponse.json({ error: "Usuário desativado" }, { status: 401 })
    }

    const senhaValida = verifyPassword(senha, usuario.senha)

    if (!senhaValida) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
    }

    const token = await createSession(usuario.id)

    const cookieStore = await cookies()
    cookieStore.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 dias
      path: "/",
    })

    return NextResponse.json({
      success: true,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        cargo: usuario.cargo,
      },
    })
  } catch (error) {
    console.error("Erro no login:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
