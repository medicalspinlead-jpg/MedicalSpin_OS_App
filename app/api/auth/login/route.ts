import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyPassword, createSession } from "@/lib/auth"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    console.log("[v0] Login: Iniciando...")

    const { email, senha } = await request.json()
    console.log("[v0] Login: Dados recebidos - email:", email)

    if (!email || !senha) {
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
    }

    console.log("[v0] Login: Buscando usuário no banco...")
    console.log("[v0] Login: DATABASE_URL existe:", !!process.env.DATABASE_URL)

    const usuario = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase() },
    })
    console.log("[v0] Login: Usuário encontrado:", !!usuario)

    if (!usuario) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
    }

    if (!usuario.ativo) {
      return NextResponse.json({ error: "Usuário desativado" }, { status: 401 })
    }

    console.log("[v0] Login: Verificando senha...")
    const senhaValida = verifyPassword(senha, usuario.senha)

    if (!senhaValida) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
    }

    console.log("[v0] Login: Criando sessão...")
    const token = await createSession(usuario.id)

    const cookieStore = await cookies()
    const isProduction = process.env.NODE_ENV === "production"
    const isHttps = request.url.startsWith("https")

    console.log("[v0] Login: isProduction:", isProduction, "isHttps:", isHttps)

    cookieStore.set("session_token", token, {
      httpOnly: true,
      secure: isHttps, // Só usa secure se a requisição for HTTPS
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    })

    console.log("[v0] Login: Cookie configurado com sucesso!")
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
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    const errorStack = error instanceof Error ? error.stack : ""
    console.error("[v0] Login ERRO:", errorMessage)
    console.error("[v0] Login ERRO Stack:", errorStack)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
